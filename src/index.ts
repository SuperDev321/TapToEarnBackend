import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Telegraf } from "telegraf";
import { AppDataSource } from "./data-source";
import { startBot } from "./handler/start";
import router from "./router";
import { AddDailyCard } from "./cron/card";

const bot = new Telegraf(process.env.BOT_TOKEN ?? "");
const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());

// Initialize TypeORM
AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    // Express routes
    bot.command("show", startBot);

    // Start bot
    bot.launch().then(() => {
      console.log("Bot is running");
    });

    app.use("/", router);

    app.listen(Number(process.env.PORT) | 5000, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    });

    // AddDailyCard();
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
