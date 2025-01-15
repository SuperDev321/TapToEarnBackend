import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { bot, startBot } from "./handler/start";
import { AppDataSource } from "./data-source";
import router from "./router";
import { AddDailyCard } from "./cron/card";

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
    bot.command("start", startBot);

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
