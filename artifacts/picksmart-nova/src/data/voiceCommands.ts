export interface VoiceCommand {
  phrase: string;
  type: "help" | "basic";
  action: string;
  description: string;
}

export const voiceCommands: VoiceCommand[] = [
  { phrase: "repeat labels", type: "help", action: "repeat_labels", description: "Replay label instructions" },
  { phrase: "makeup skips", type: "help", action: "makeup_skips", description: "Retrieve skipped slots" },
  { phrase: "get drops", type: "help", action: "get_drops", description: "Retrieve replenishments" },
  { phrase: "close batch", type: "help", action: "close_batch", description: "Close current batch" },
  { phrase: "go to aisle [#]", type: "help", action: "go_to_aisle", description: "Jump to aisle" },

  { phrase: "load picks", type: "basic", action: "load_picks", description: "Load assigned batch" },
  { phrase: "base items", type: "basic", action: "base_items", description: "Review base items" },
  { phrase: "confirm / yes / affirmative", type: "basic", action: "confirm", description: "Confirm current prompt" },
  { phrase: "no / cancel / negative", type: "basic", action: "deny", description: "Deny current prompt" },
  { phrase: "previous", type: "basic", action: "previous", description: "Go to previous item" },
  { phrase: "base complete", type: "basic", action: "base_complete", description: "Base setup finished" },
  { phrase: "grab", type: "basic", action: "grab", description: "Confirm pick quantity" },
  { phrase: "remove pallet", type: "basic", action: "remove_pallet", description: "Remove pallet from slot" },
  { phrase: "skip slot", type: "basic", action: "skip_slot", description: "Skip current slot" },
  { phrase: "report damage", type: "basic", action: "report_damage", description: "Start damage flow" },
  { phrase: "damage [#]", type: "basic", action: "damage_count", description: "Report damaged case count" },
  { phrase: "slot empty", type: "basic", action: "slot_empty", description: "Mark slot empty" },
  { phrase: "recap weights", type: "basic", action: "recap_weights", description: "Replay weight entries" },
  { phrase: "next", type: "basic", action: "next", description: "Next list item" },
  { phrase: "exit list", type: "basic", action: "exit_list", description: "Exit list mode" },
  { phrase: "no labels", type: "basic", action: "no_labels", description: "Label print failed" },
];

export const VOICE_COMMANDS = voiceCommands;
