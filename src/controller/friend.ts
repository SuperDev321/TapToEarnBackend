import { Request, Response } from "express";
import { User } from "../entity/User";
import { getFriends } from "../service/friend";

export const fetchFriends = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { limit, offset } = req.query;

    let limitNumber = parseInt(limit as string, 10);
    let offsetNumber = parseInt(offset as string, 10);

    if (isNaN(limitNumber) || limitNumber < 0) {
      // Set a default value or handle the error
      limitNumber = 10; // Default value
    }

    if (isNaN(offsetNumber) || offsetNumber < 0) {
      // Set a default value or handle the error
      offsetNumber = 0; // Default value
    }

    const friends = await getFriends(user, limitNumber, offsetNumber);
    res.json(friends);
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
