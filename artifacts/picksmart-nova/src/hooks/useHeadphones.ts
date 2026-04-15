import { useState, useEffect, useCallback } from "react";

export interface HeadphoneState {
  connected: boolean;
  preferredMicId: string | undefined;
  label: string;
}

const HEADPHONE_PATTERN = /headphone|headset|bluetooth|airpod|earphone|earpiece|bt |ble |wireless/i;

async function detectHeadphones(): Promise<HeadphoneState> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.enumerateDevices
  ) {
    return { connected: false, preferredMicId: undefined, label: "" };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const audioInputs  = devices.filter((d) => d.kind === "audioinput");
    const audioOutputs = devices.filter((d) => d.kind === "audiooutput");

    const headphoneMic    = audioInputs.find((d)  => HEADPHONE_PATTERN.test(d.label));
    const headphoneOutput = audioOutputs.find((d) => HEADPHONE_PATTERN.test(d.label));

    const connected = !!(headphoneMic || headphoneOutput);
    return {
      connected,
      preferredMicId: headphoneMic?.deviceId ?? undefined,
      label:
        headphoneMic?.label ||
        headphoneOutput?.label ||
        (connected ? "Headphones" : ""),
    };
  } catch {
    return { connected: false, preferredMicId: undefined, label: "" };
  }
}

export function useHeadphones(): HeadphoneState {
  const [state, setState] = useState<HeadphoneState>({
    connected: false,
    preferredMicId: undefined,
    label: "",
  });

  const refresh = useCallback(async () => {
    const next = await detectHeadphones();
    setState(next);
  }, []);

  useEffect(() => {
    refresh();

    if (navigator.mediaDevices && "addEventListener" in navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", refresh);
      return () =>
        navigator.mediaDevices.removeEventListener("devicechange", refresh);
    }
  }, [refresh]);

  // Re-check after mic permission is granted (device labels become available)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return state;
}
