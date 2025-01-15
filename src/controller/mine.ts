import { Request, Response } from "express";
import {
  ErrInsufficientEnergy,
  ErrMiningTooFast,
  mineMany,
} from "../service/mine";
import { User } from "../entity/User";

export const mine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count } = req.body;
    const user = (req as any).user as User;

    try {
      const result = await mineMany(user, count);
      res.status(200).json(result);
    } catch (error) {
      if (error) {
        if (error === ErrInsufficientEnergy) {
          res
            .status(403)
            .json({ success: false, message: "Insufficient Energy" });
        } else if (error === ErrMiningTooFast) {
          res.status(429).json({ success: false, message: "Mining Too Fast" });
        } else {
          console.error("Unexpected Error while mining:", error);
          res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
        }
      }
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
