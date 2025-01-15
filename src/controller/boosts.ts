import { Request, Response } from "express";
import { User } from "../entity/User";
import { getBoosts, purchaseBoosts } from "../service/boosts";
import { newUserResponse } from "../service/user";

export const fetchBoosts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const boosts = getBoosts(user);
    res.json({ success: true, ...boosts });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateBoosts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const { boost } = req.body;
    await purchaseBoosts(user, boost);
    const boosts = getBoosts(user);
    const userResonse = newUserResponse(user);
    res.json({ success: true, boosts, user: userResonse });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
