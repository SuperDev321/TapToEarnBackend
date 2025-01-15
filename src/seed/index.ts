import { AppDataSource } from "../data-source";
import { DailyBonus } from "../entity/DailyBonus";

const dailyBonuses = [
  { reward: 100 },
  { reward: 500 },
  { reward: 1000 },
  { reward: 5000 },
  { reward: 10_000 },
  { reward: 20_000 },
  { reward: 50_000 },
  { reward: 100_000 },
  { reward: 250_000 },
  { reward: 500_000 },
  { reward: 1_000_000 },
  { reward: 5_000_000 },
];

const seed = async () => {
  try {
    const dataSource = await AppDataSource.initialize();

    for (const item of dailyBonuses) {
      const entity = new DailyBonus();
      entity.reward = item.reward;

      await dataSource.manager.save(entity);
    }

    console.log("seed successfully!");
    await dataSource.destroy();
  } catch (error) {
    console.error("Error seeding achievements:", error);
  }
};

seed();
