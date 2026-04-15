import { useState, useEffect, useCallback } from "react";

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface HeadphoneState {
  connected: boolean;
  preferredMicId: string | undefined;
  label: string;
  allMicDevices: AudioDevice[];
  refresh: () => Promise<void>;
}

// Labels that identify built-in / default mics — anything else is external
const BUILTIN_PATTERN = /built.?in|internal|default|communications/i;

// Labels that clearly identify wireless/headphone devices
const HEADPHONE_PATTERN =
  /headphone|headset|bluetooth|airpod|earphone|earpiece|wireless|bt |ble |beatsX|bose|sony|jabra|plantronics|poly|sennheiser|logitech|anker|jabra|skullcandy|jbl|samsung buds|galaxy buds|pixel buds|wh-|wf-|qc\d|soundcore/i;

function pickBestMic(inputs: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
  // 1. Prefer a device whose label explicitly says headphone/bluetooth
  const explicit = inputs.find((d) => HEADPHONE_PATTERN.test(d.label));
  if (explicit) return explicit;

  // 2. Fall back to the first non-built-in device (external mic = likely headphone/BT)
  const external = inputs.find(
    (d) => d.label && !BUILTIN_PATTERN.test(d.label) && d.deviceId !== "default",
  );
  return external;
}

async function enumerate(): Promise<{
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.enumerateDevices
  ) {
    return { inputs: [], outputs: [] };
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs:  devices.filter((d) => d.kind === "audioinput"),
      outputs: devices.filter((d) => d.kind === "audiooutput"),
    };
  } catch {
    return { inputs: [], outputs: [] };
  }
}

export function useHeadphones(): HeadphoneState {
  const [state, setState] = useState<HeadphoneState>({
    connected: false,
    preferredMicId: undefined,
    label: "",
    allMicDevices: [],
    refresh: async () => {},
  });

  const refresh = useCallback(async () => {
    const { inputs, outputs } = await enumerate();

    const hasLabels = inputs.some((d) => d.label !== "");

    // Best headphone/BT mic
    const bestMic = hasLabels ? pickBestMic(inputs) : undefined;

    // Check outputs too (headphones may only expose output device before permission)
    const headphoneOutput = outputs.find((d) => HEADPHONE_PATTERN.test(d.label));

    const connected = !!(bestMic || headphoneOutput);

    // Build device list for manual picker (filter out duplicates + empty labels)
    const allMicDevices: AudioDevice[] = inputs
      .filter((d) => d.deviceId !== "" && d.deviceId !== "default")
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${d.deviceId.slice(0, 6)}`,
      }));

    setState((prev) => ({
      ...prev,
      connected,
      preferredMicId: bestMic?.deviceId,
      label:
        bestMic?.label ||
        headphoneOutput?.label ||
        (connected ? "Headphones" : ""),
      allMicDevices,
    }));
  }, []);

  // Attach refresh to state so callers can trigger re-detect
  useEffect(() => {
    setState((prev) => ({ ...prev, refresh }));
  }, [refresh]);

  // Initial enumerate + listen for plug/unplug events
  useEffect(() => {
    refresh();

    if (navigator.mediaDevices && "addEventListener" in navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", refresh);
      return () =>
        navigator.mediaDevices.removeEventListener("devicechange", refresh);
    }
  }, [refresh]);

  // Re-check when the tab regains focus (user may have connected BT headphones)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Watch the Permissions API — re-enumerate as soon as mic is "granted"
  // because device labels become available only after permission is given.
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("permissions" in navigator) ||
      typeof (navigator as Navigator).permissions?.query !== "function"
    ) {
      return;
    }

    let permStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        permStatus = status;
        if (status.state === "granted") refresh();
        status.addEventListener("change", refresh);
      })
      .catch(() => {});

    return () => {
      permStatus?.removeEventListener("change", refresh);
    };
  }, [refresh]);

  return state;
}
