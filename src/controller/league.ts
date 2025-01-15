import { Request, Response } from "express";
import { User } from "../entity/User";
import { Leagues } from "../constants/user";

export const getLeagues = (req: Request, res: Response) => {
  try {
    const leagues = Leagues;
    res.json({ success: true, leagues });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
