import { Context } from "telegraf";
import { startMenuText } from "../constants";

export const startBot = (ctx: Context) => {
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Start",
            web_app: {
              url: process.env.FRONTEND_URL ?? "", // Your frontend URL
            },
          },
        ],
      ],
    },
  };

  // Send the message with the inline button
  ctx.sendMessage(startMenuText["en"], inlineKeyboard);
};
