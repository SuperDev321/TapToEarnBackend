import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Card } from "./entity/Card";
import { CardLevel } from "./entity/CardLevel";
import { UserCard } from "./entity/UserCard";
import { DailyBonus } from "./entity/DailyBonus";
import { Friend } from "./entity/Friend";
import { MiningPerDay, MiningPerMonth } from "./entity/Mining";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "1234",
  database: "newBunny",
  synchronize: true,
  logging: false,
  entities: [
    User,
    Card,
    CardLevel,
    UserCard,
    DailyBonus,
    Friend,
    MiningPerDay,
    MiningPerMonth,
  ],
  migrations: [],
  subscribers: [],
});
