import { useEffect } from "react";
import { Platform } from "react-native";

export function useBackgroundAudio() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    let mounted = true;
    (async () => {
      try {
        const { Audio } = await import("expo-av");
        if (!mounted) return;
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          allowsRecordingIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
}
