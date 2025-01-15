import { Request, Response } from "express";
import { User } from "../entity/User";
import { getDailyBonuses, pickDailyBonus } from "../service/bonus";
import { newUserResponse } from "../service/user";

export const fetchDailyBonuses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const dailyBonuses = await getDailyBonuses(user);
    res.json(dailyBonuses);
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const claimDailyBonus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    await pickDailyBonus(user);
    const _user = await pickDailyBonus(user);
    res.json(newUserResponse(_user));
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
