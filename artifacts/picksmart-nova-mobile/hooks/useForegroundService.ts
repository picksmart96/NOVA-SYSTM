import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import type { Audio } from "expo-av";
import type * as NotificationsNS from "expo-notifications";

type AVSound = InstanceType<typeof Audio.Sound>;
type NotificationsModule = typeof NotificationsNS;

/**
 * Identifier for the picking-session foreground-service notification.
 * Exported so the app root can dismiss any stale notification on startup
 * (in case the previous session ended via a hard app kill before JS cleanup ran).
 */
export const PICKING_NOTIFICATION_ID = "nova-picking-active";
const PICKING_CHANNEL_ID = "nova-picking";

/**
 * Keeps Android mic access alive when the screen locks while a picking session
 * is active.
 *
 * Android prevents background processes from accessing the microphone. Keeping
 * the app in an audio foreground-service state (via expo-av with
 * staysActiveInBackground:true + active audio playback) removes that restriction.
 * A silent looping WAV maintains the audio track without audible output while
 * the session runs. Android additionally requires every foreground service to
 * display a user-visible notification, posted here via expo-notifications.
 *
 * On iOS, the audio session configured in useBackgroundAudio is sufficient.
 * On web this hook is a no-op.
 */
export function useForegroundService(active: boolean, isES = false) {
  const soundRef = useRef<AVSound | null>(null);
  const notifPostedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!active) {
      stopAndDismiss(soundRef, notifPostedRef);
      return;
    }

    let cancelled = false;

    async function start() {
      // ── Silent audio loop: elevates process to audio foreground service ──
      try {
        const { Audio } = await import("expo-av");
        if (cancelled) return;
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("../assets/audio/silence.wav"),
          { isLooping: true, volume: 0, isMuted: true, shouldPlay: false },
        );
        if (cancelled) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
        await sound.playAsync();
      } catch (err) {
        console.warn("[ForegroundService] audio start failed:", err);
      }

      // ── Persistent notification: required for any Android foreground service ──
      let N: NotificationsModule;
      try {
        N = await import("expo-notifications");
      } catch (err) {
        console.warn("[ForegroundService] expo-notifications unavailable:", err);
        return;
      }
      if (cancelled) return;

      await N.setNotificationChannelAsync(PICKING_CHANNEL_ID, {
        name: isES ? "Sesión de picking activa" : "Picking session active",
        importance: N.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: null,
        enableVibrate: false,
        lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: true,
        }),
      });

      const { status } = await N.requestPermissionsAsync();
      if (cancelled || status !== "granted") return;

      await N.scheduleNotificationAsync({
        identifier: PICKING_NOTIFICATION_ID,
        content: {
          title: isES ? "NOVA Picking activo" : "NOVA Picking active",
          body: isES
            ? "El micrófono está activo. Toca para volver."
            : "Microphone is active. Tap to return.",
          sticky: true,
          autoDismiss: false,
          priority: "low",
          color: "#7c3aed",
          sound: false,
        },
        trigger: null,
      });
      notifPostedRef.current = true;
    }

    start();
    return () => {
      cancelled = true;
      stopAndDismiss(soundRef, notifPostedRef);
    };
  }, [active, isES]);
}

async function stopAndDismiss(
  soundRef: React.MutableRefObject<AVSound | null>,
  notifPostedRef: React.MutableRefObject<boolean>,
) {
  const sound = soundRef.current;
  if (sound !== null) {
    soundRef.current = null;
    await sound.stopAsync().catch(() => {});
    await sound.unloadAsync().catch(() => {});
  }
  if (notifPostedRef.current) {
    notifPostedRef.current = false;
    const N = await import("expo-notifications").catch(() => null);
    if (N) {
      await N.dismissNotificationAsync(PICKING_NOTIFICATION_ID).catch(() => {});
      await N.cancelScheduledNotificationAsync(PICKING_NOTIFICATION_ID).catch(() => {});
    }
  }
}
