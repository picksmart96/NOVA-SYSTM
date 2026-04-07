export interface SystemDefaults {
  printerNumber: number;
  alphaLabelNumber: number;
  bravoLabelNumber: number;
  defaultVoiceMode: string;
  warehouseName: string;
}

export const SYSTEM_DEFAULTS: SystemDefaults = {
  printerNumber: 307,
  alphaLabelNumber: 242,
  bravoLabelNumber: 578,
  defaultVoiceMode: "training",
  warehouseName: "Main Distribution Center",
};
