import { Context, Telegraf } from "telegraf";
import { getCommandArguments, isCommand } from "../utils/tg";
import { User } from "telegraf/typings/core/types/typegram";
import { getUser, updateUserAvatar } from "../service/user";

interface UserOptions {
  tgUser: User;
  IsPrivate: boolean;
  promo: string;
}

export const botMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  try {
    if (ctx.message && "text" in ctx.message) {
      const referralCode = ctx.message.text.split(" ")?.[1];
      ctx.state.referralCode = referralCode;
    }

    let tgUser = ctx.from;

    if (tgUser === null && "chosen_inline_result" in ctx.update) {
      tgUser = ctx.update.chosen_inline_result.from;
    }

    if (!tgUser) {
      throw new Error("No user found");
    }

    if (
      ctx.chat &&
      ctx.chat.type !== "channel" &&
      "chat_member" in ctx.update &&
      ctx.update.chat_member
    ) {
      return null;
    }

    let isPrivate = false;
    if (ctx.chat && ctx.chat.type == "private") {
      isPrivate = true;
    }

    let promo = "";

    if (isCommand(ctx.update, "/start")) {
      const args = getCommandArguments(ctx.update);
      if (args !== "") {
        promo = args;
      }
    }

    const getUserOpts: UserOptions = {
      tgUser: tgUser,
      IsPrivate: isPrivate,
      promo: promo,
    };

    const user = await getUser(getUserOpts);

    if (!user.avatarUrl) {
      const chatInfo = await ctx.telegram.getChat(tgUser.id);
      if (chatInfo.photo) {
        const file = await ctx.telegram.getFile(chatInfo.photo.big_file_id);
        const fileLink = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;
        try {
          await updateUserAvatar(user, fileLink);
        } catch (err) {
          console.error("update user avatar", err);
        }
      }
    }

    ctx.state.user = user;

    if (user.botState) {
      ctx.state.botState = user.botState;
    }
    // Store user data or referral code in ctx.state
    // Store user data or referral code in ctx.state

    // Proceed to the next middleware or handler
    next();
  } catch (error) {
    console.error("Bot Middleware Error:", error);
    // Handle the error
  }
};
