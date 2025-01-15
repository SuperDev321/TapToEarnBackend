import { MaxBoosterLevel } from "../constants/user";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const newBoostsResponse = (user: User) => {
  return {
    current_mine_level: user.mineLevel,
    current_energy_level: user.maxEnergyLevel,
    mine_level_price: user.MineLevelUpgradePrice(),
    current_max_energy: user.MaxEnergyBoost(),
    max_energy_price: user.MaxEnergyUpgradePrice(),
    energy_level_price: user.energyLevel,
    auto_farmer_price: user.autoFarmerProfit,
  };
};

export const getBoosts = (user: User) => {
  return newBoostsResponse(user);
};

const buyMultitap = (user: User) => {
  return AppDataSource.transaction(async (trx) => {
    const u = await trx.getRepository(User).findOne({ where: { id: user.id } });
    if (!u) throw new Error("User not found");
    if (u.balance < u.MineLevelUpgradePrice())
      throw new Error("Insufficient balance");
    if (u.mineLevel === MaxBoosterLevel)
      throw new Error("Max booster level reached");

    u.balance -= u.MineLevelUpgradePrice();
    u.mineLevel++;

    trx.save(u);
    return null;
  });
};

const buyMaxEnergyLimit = (user: User) => {
  return AppDataSource.transaction(async (trx) => {
    const u = await trx.getRepository(User).findOne({ where: { id: user.id } });
    if (!u) throw new Error("User not found");
    if (u.balance < u.MaxEnergyUpgradePrice())
      throw new Error("Insufficient balance");
    if (u.maxEnergyLevel === MaxBoosterLevel)
      throw new Error("Max booster level reached");

    u.balance -= u.MaxEnergyUpgradePrice();
    u.maxEnergyLevel++;

    trx.save(u);
    return null;
  });
};

export const purchaseBoosts = async (user: User, boost: string) => {
  switch (boost) {
    case "multitap":
      await buyMultitap(user);
      break;
    case "max_energy":
      await buyMaxEnergyLimit(user);
      break;
    default:
      break;
  }
};
