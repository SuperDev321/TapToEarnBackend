import { Raw } from "typeorm";
import { AppDataSource } from "../data-source";
import { MiningPerDay, MiningPerMonth } from "../entity/Mining";
import { User } from "../entity/User";
import { getNextLeague } from "./user";

export const ErrInsufficientEnergy = new Error("insufficient energy");
export const ErrMaxEnergyExceeded = new Error("energy limit exceeded");
export const ErrMiningTooFast = new Error("mining too fast");

export async function mineMany(user: User, count: number): Promise<any> {
  if (count < 1) {
    throw new Error("Count must be greater than 0");
  }

  const minDuration = (count * 1000) / 30;
  const diff = Date.now() - user.lastMineAt.getTime();

  if (diff < minDuration) {
    throw ErrMiningTooFast;
  }

  const mined = user.CurrentEarnPerTap() * count;

  if (user.CurrentAvailableEnergy() < mined) {
    throw ErrInsufficientEnergy;
  }

  user.energy = Number(user.energy) + mined;
  user.balance = Number(user.balance) + mined;
  user.lastMineAt = new Date();

  const nextLeagueID = await getNextLeague(user.balance, user.league);
  if (user.league !== nextLeagueID && nextLeagueID !== 0) {
    user.league = nextLeagueID;
  }

  await AppDataSource.transaction(async (trx) => {
    await trx.save(user);

    const date = new Date().toISOString().split("T")[0];

    const MiningPerDayRepo = trx.getRepository(MiningPerDay);

    await MiningPerDayRepo.upsert(
      {
        date: new Date(date),
        userId: user.id,
        league: user.league,
        mined: mined,
      },
      {
        conflictPaths: ["date", "userId"], // Corresponds to `Columns: []clause.Column`
        skipUpdateIfNoValuesChanged: false,
      }
    );

    // Update the mined field by adding the new mined value
    await MiningPerDayRepo.createQueryBuilder()
      .update(MiningPerDay)
      .set({
        mined: () => `mined + ${mined}`,
      })
      .where("date = :date AND userId = :userId", {
        date: new Date(date),
        userId: user.id,
        mined,
      })
      .execute();

    const monthDate = new Date().toISOString().split("T")[0].slice(0, 7);
    const MiningPerMonthRepo = trx.getRepository(MiningPerMonth);

    await MiningPerMonthRepo.upsert(
      {
        date: new Date(monthDate),
        userId: user.id,
        league: user.league,
        mined: mined,
      },
      {
        conflictPaths: ["date", "userId"], // Corresponds to `Columns: []clause.Column`
        skipUpdateIfNoValuesChanged: false,
      }
    );

    // Update the mined field by adding the new mined value
    await MiningPerMonthRepo.createQueryBuilder()
      .update(MiningPerDay)
      .set({
        mined: () => `mined + ${mined}`,
      })
      .where("date = :date AND userId = :userId", {
        date: new Date(monthDate),
        userId: user.id,
        mined,
      })
      .execute();
    if (user.refererId && user.mineLevel > 1) {
      user.balance = user.balance + Math.floor(count / 2);
      user.referralProfit = Number(user.referralProfit) + Math.floor(count / 2);

      await trx.save(user);
    }
  });

  return {
    balance: user.balance,
    mined: mined,
    newEnergy: user.CurrentAvailableEnergy(),
    league: user.FullCurrentLeague(),
    current_league: user.league,
    next_league: user.FullNextLeague(),
  };
}
