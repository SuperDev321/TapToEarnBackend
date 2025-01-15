import { parse } from "csv-parse";
import { cards } from "../constants/card";
import fs from "fs";
import path from "path";
import { Card } from "../entity/Card";
import { AppDataSource } from "../data-source";
import { CardLevel } from "../entity/CardLevel";

interface CardRow {
  [key: string]: string; // Adjust to the expected structure of your CSV rows
}

export const AddDailyCard = async () => {
  const _currentCard = cards[0];

  const currentCard = AppDataSource.getRepository(Card).create(_currentCard);

  await AppDataSource.manager.save(currentCard);

  const rows: CardRow[] = []; // Define the structure of rows

  const filePath = path.resolve(
    __dirname,
    `../constants/cards/${currentCard.name}.csv`
  );

  fs.createReadStream(filePath)
    .pipe(
      parse({
        columns: true, // Automatically use the first row as headers
        skip_empty_lines: true, // Skip empty lines
      })
    )
    .on("data", (row: CardRow) => {
      rows.push(row);
    })
    .on("end", async () => {
      console.log("CSV file successfully processed:");

      const cardLevels = rows.map((row) => {
        return {
          level: Number(row["lvl"]),
          cardId: currentCard.id,
          cost: row.price,
          farmingUpgrade: row["farming"] !== "" ? Number(row["farming"]) : 0,
          totalFarming:
            row["total farming"] !== "" ? Number(row["total farming"]) : 0,
        };
      });

      await AppDataSource.transaction(async (trx) => {
        cardLevels.forEach(async (_cardLevel) => {
          const cardLevel = trx.getRepository(CardLevel).create(_cardLevel);
          await trx.save(cardLevel);
        });
      });
    })
    .on("error", (error: Error) => {
      console.error("Error while reading the CSV file:", error.message);
    });
};
