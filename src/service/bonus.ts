import { AppDataSource } from "../data-source";
import { DailyBonus } from "../entity/DailyBonus";
import { User } from "../entity/User";
import { getNextLeague } from "./user";

export const getDailyBonuses = async (user: User) => {
  try {
    const bonuses = await AppDataSource.getRepository(DailyBonus).find();

    let dailyBonusStreak = user.dailyBonusStreak;

    if (user.lastDailyBonusAt !== null) {
      const beg = new Date(user.lastDailyBonusAt).setUTCHours(0, 0, 0, 0);
      if (
        beg < new Date(Date.now() - 24 * 60 * 60 * 1000).setUTCHours(0, 0, 0, 0)
      ) {
        dailyBonusStreak = 0;
      }
    }

    const maxStreakDay = bonuses[bonuses.length - 1].id;

    if (dailyBonusStreak === maxStreakDay) {
      dailyBonusStreak = 0;
    }

    const nowDate = new Date();
    nowDate.setUTCHours(0, 0, 0, 0);

    const resp: any = {};

    resp.has_available = false;

    for (let idx = 0; idx < bonuses.length; idx++) {
      const bonus = bonuses[idx];
      bonus.claimed = false;
      bonus.current = false;
      if (bonus.id <= user.dailyBonusStreak) {
        bonus.claimed = true;
      }
      if (bonus.id == 1 && user.lastDailyBonusAt == null) {
        bonus.current = true;
      } else if (
        bonus.id == user.dailyBonusStreak + 1 &&
        user.lastDailyBonusAt != null
      ) {
        bonus.current = true;
      }

      if (
        !bonus.claimed &&
        bonus.current &&
        (user.lastDailyBonusAt == null ||
          nowDate > new Date(user.lastDailyBonusAt))
      ) {
        resp.has_available = true;
      }
    }

    resp.bonuses = bonuses;

    return resp;
  } catch (error) {
    console.error("Error getting daily bonuses:", error);
    return { dailyBonuses: [] };
  }
};

export const pickDailyBonus = async (user: User) => {
  const bonuses = await AppDataSource.getRepository(DailyBonus).find();

  if (bonuses.length === 0) {
    throw new Error("No daily bonus rewards in db");
  }

  const lastBonus = bonuses[bonuses.length - 1];

  let dailyBonusStreak = user.dailyBonusStreak;

  if (dailyBonusStreak === lastBonus.id) {
    dailyBonusStreak = 0;
  }

  if (user.lastDailyBonusAt !== null) {
    const beg = new Date(user.lastDailyBonusAt).setUTCHours(0, 0, 0, 0);
    if (
      beg < new Date(Date.now() - 24 * 60 * 60 * 1000).setUTCHours(0, 0, 0, 0)
    ) {
      dailyBonusStreak = 0;
    }

    if (beg === new Date(Date.now()).setUTCHours(0, 0, 0, 0)) {
      return user;
    }
  }

  const bonus = bonuses.find((b) => b.id === dailyBonusStreak + 1);

  if (!bonus || bonus.id === 0) {
    throw new Error("No daily bonus found");
  }

  const newtBalance = Number(user.balance) + Number(bonus.reward);

  user.balance = newtBalance;
  user.dailyBonusStreak = bonus.id;
  user.lastDailyBonusAt = new Date(new Date().toISOString());

  const nextLeagueId = await getNextLeague(newtBalance, user.league);

  if (user.league !== nextLeagueId && nextLeagueId !== 0) {
    user.league = nextLeagueId - 1;
  }

  const _user = await AppDataSource.getRepository(User).save(user);

  return _user;
};
