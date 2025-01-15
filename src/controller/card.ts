import { Request, Response } from "express";
import { User } from "../entity/User";
import { getCards, purchaseCard as _purchaseCard } from "../service/card";

export const fetchCards = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { category } = req.query;
    const cards = await getCards(user, category as string);
    res.json(cards);
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const purchaseCard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { cardId } = req.body;
    const result = await _purchaseCard(user, cardId);
    res.json(result);
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
