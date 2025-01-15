import { Context, Telegraf } from "telegraf";
import { startMenuText } from "../constants";
import { botMiddleware } from "../middleware/bot";
import { getUserFromContext } from "../service/user";

export const bot = new Telegraf(process.env.BOT_TOKEN ?? "");

bot.use(botMiddleware);

export const startBot = (ctx: Context) => {
  const user = getUserFromContext(ctx);

  let txt =
    startMenuText[user.languageCode as keyof typeof startMenuText] ??
    startMenuText["en"];
  if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date()) {
    txt +=
      "\n" +
      `Your premium expires at: ${new Date(
        user.premiumExpiresAt
      ).toLocaleString()}`;
  }

  const row: any = [
    {
      text: "Join Community",
      url: "https://t.me/bunnyblitz", // Your community link
      parse_mode: "HTML",
    },
    {
      text: "Start",
      web_app: {
        url: process.env.FRONTEND_URL ?? "", // Your frontend URL
      },
      parse_mode: "HTML",
    },
  ];
  if (user.role === "admin") {
    row.push({
      text: "⚙️ Admin panel",
      callback_data: "admin_panel",
    });
  }

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [row],
    },
  };

  if ("callback_query" in ctx.update) {
    return ctx.editMessageText(txt, {
      reply_markup: inlineKeyboard.reply_markup,
    });
  }

  // Send the message with the inline button
  ctx.sendMessage(txt, inlineKeyboard);
};
