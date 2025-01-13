export enum QuestType {
  Telegram = 0,
  Discord = 1,
  YouTube = 2,
  Twitter = 3,
  Other = 4,
}

export const QuestTypesMap: Record<QuestType, string> = {
  [QuestType.Telegram]: "Telegram",
  [QuestType.Discord]: "Discord",
  [QuestType.YouTube]: "YouTube",
  [QuestType.Twitter]: "Twitter",
  [QuestType.Other]: "Other",
};
