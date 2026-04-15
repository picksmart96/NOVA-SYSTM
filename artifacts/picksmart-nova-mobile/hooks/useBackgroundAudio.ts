import { useEffect } from "react";
import { Platform } from "react-native";

export function useBackgroundAudio() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    let mounted = true;
    (async () => {
      try {
        const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = await import("expo-av");
        if (!mounted) return;
        await Audio.setAudioModeAsync({
          // Stay active when screen locks or app backgrounds
          staysActiveInBackground: true,
          // Play through silent switch on iOS (ringer off)
          playsInSilentModeIOS: true,
          // Allow mic recording alongside playback (needed for voice commands)
          allowsRecordingIOS: true,
          // Don't duck others — NOVA should be at full volume
          shouldDuckAndroid: false,
          // Route to speaker/headphones, never the phone earpiece
          playThroughEarpieceAndroid: false,
          // Don't interrupt other audio — mix instead
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
}
