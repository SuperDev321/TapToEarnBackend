import { group } from "console";
import { AppDataSource } from "../data-source";
import { Card } from "../entity/Card";
import { CardLevel } from "../entity/CardLevel";
import { User } from "../entity/User";
import { UserCard } from "../entity/UserCard";

export const getCards = async (user: User, category: string) => {
  const cards = await AppDataSource.getRepository(Card)
    .createQueryBuilder("cards")
    .leftJoinAndSelect(
      CardLevel,
      "first_card_levels",
      "cards.id = first_card_levels.card_id AND first_card_levels.level = 1"
    )
    .leftJoinAndSelect(
      UserCard,
      "user_cards",
      "user_cards.card_id = cards.id AND user_cards.user_id = :userId",
      { userId: user.id }
    )
    .leftJoinAndSelect(
      CardLevel,
      "card_levels",
      "card_levels.card_id = user_cards.card_id AND user_cards.level_id = card_levels.id"
    )
    .leftJoinAndSelect(
      CardLevel,
      "next_card_levels",
      "next_card_levels.card_id = card_levels.card_id AND next_card_levels.level = card_levels.level + 1"
    )
    .select([
      "cards.id as id",
      "cards.name as name",
      "cards.logo_s3_key as logo_s3_key",
      "cards.description as description",
      "cards.category as category",
      "COALESCE(card_levels.id, 0) AS cur_level",
      "COALESCE(next_card_levels.cost, first_card_levels.cost) AS upgrade_cost",
      "COALESCE(next_card_levels.farming_upgrade, first_card_levels.farming_upgrade) AS farming_upgrade",
      "COALESCE(card_levels.total_farming, 0) AS cur_total_farming",
    ])
    .where("cards.category = :category", { category: category })
    .groupBy("cards.id")
    .addGroupBy("cards.name")
    .addGroupBy("cards.logo_s3_key")
    .addGroupBy("cards.description")
    .addGroupBy("cards.category")
    .addGroupBy("card_levels.id")
    .addGroupBy("next_card_levels.cost")
    .addGroupBy("next_card_levels.farming_upgrade")
    .addGroupBy("card_levels.total_farming")
    .addGroupBy("first_card_levels.cost")
    .addGroupBy("first_card_levels.farming_upgrade")
    .getRawMany();

  return cards;
};

export const purchaseCard = async (user: User, cardId: number) => {
  const card = await AppDataSource.getRepository(Card).findOneBy({
    id: cardId,
  });

  if (!card) {
    throw new Error("Card not found");
  }

  const userCard = await AppDataSource.getRepository(UserCard).findOneBy({
    userId: user.id,
    cardId: card.id,
  });

  let levelId = 1;
  if (userCard) {
    levelId = userCard.levelId + 1;
  }

  const cardLevel = await AppDataSource.getRepository(CardLevel).findOneBy({
    level: levelId,
    cardId,
  });

  if (!cardLevel) {
    throw new Error("Card level not found");
  }

  const cost = parseInt(cardLevel.cost, 10);

  if (user.balance < cost) {
    throw new Error("Insufficient balance");
  }

  await AppDataSource.transaction(async (trx) => {
    user.balance -= cost;
    await trx.save(user);

    if (userCard) {
      userCard.levelId = levelId;
      await trx.save(userCard);
    } else {
      await trx.getRepository(UserCard).insert({
        userId: user.id,
        cardId: card.id,
        levelId,
      });
    }
  });

  const newBalance = user.balance;
  const cards = await getCards(user, card.category);

  return {
    balance: newBalance,
    cards,
  };
};
