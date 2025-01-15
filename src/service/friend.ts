import { Equal } from "typeorm";
import { AppDataSource } from "../data-source";
import { Friend } from "../entity/Friend";
import { User } from "../entity/User";
import { friendsLinkText } from "../constants";
import { bot } from "../handler/start";

export const getFriends = async (user: User, limit: number, offset: number) => {
  const _friends = await AppDataSource.getRepository(Friend).find({
    where: { userId: Equal(user.id) },
    take: limit,
    skip: offset,
    order: { createdAt: "DESC" },
  });

  const friends = [];
  for (const friend of _friends) {
    let identity = "";
    let avatar = "";

    if (friend.friend) {
      if (friend.friend.username != "") {
        identity = "@" + friend.friend.username;
      } else if (friend.friend.firstName != "") {
        identity = friend.friend.firstName;
      }
      if (friend.friend.avatarUrl) {
        avatar = friend.friend.avatarUrl;
      }
      if (identity === "") {
        identity = `tg:${friend.friend.id}`;
      }
    }
    friends.push({
      avatar,
      identity,
      reward: friend.reward,
    });
  }

  let text = friendsLinkText["en"];

  if (
    user.languageCode &&
    friendsLinkText[user.languageCode as keyof typeof friendsLinkText]
  ) {
    text = friendsLinkText[user.languageCode as keyof typeof friendsLinkText];
  }

  const friendLink = `https://t.me/share/url?${new URLSearchParams({
    url: `https://t.me/${bot.botInfo?.username}?start=r_${user.id}`,
    text: encodeURIComponent(text).replace(/\+/g, "%20"),
  }).toString()}`;

  const copyLink = `https://t.me/${bot.botInfo?.username ?? ""}?start=r_${
    user.id
  }`;

  return {
    friends,
    friends_count: friends.length,
    friend_link: friendLink,
    copy_link: copyLink,
  };
};
