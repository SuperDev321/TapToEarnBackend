import { Update } from "telegraf/typings/core/types/typegram";
import { MessageEntity } from "telegraf/typings/core/types/typegram";

export function isCommand(update: Update, ...cmd: string[]): boolean {
  const message = (update as any).message;
  if (message == null) {
    return false;
  }
  if (message.entities == null || message.entities.length === 0) {
    return false;
  }

  const e: MessageEntity = message.entities[0];

  if (cmd.length > 0) {
    return (
      e.offset === 0 &&
      e.type === "bot_command" &&
      message.text.startsWith(cmd[0])
    );
  }

  return e.offset === 0 && e.type === "bot_command";
}

export function getCommandArguments(update: Update): string {
  if (!isCommand(update)) {
    return "";
  }
  const message = (update as any).message;
  const e: MessageEntity = message.entities[0];
  if (message.text.length === e.length) {
    return "";
  }

  return message.text.slice(e.length + 1);
}
