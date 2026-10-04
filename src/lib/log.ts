export const ROUNDS = ["online-test", "dsa", "system-design", "hr", "other"] as const;
export type Round = (typeof ROUNDS)[number];
export const ROUND_LABEL: Record<Round, string> = {
  "online-test": "Online test",
  dsa: "DSA round",
  "system-design": "System design",
  hr: "HR / behavioural",
  other: "Other",
};
