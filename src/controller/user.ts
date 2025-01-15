import { Request, Response } from "express";
import {
  authorizeByWebApp,
  getLeaderboard,
  newUserResponse,
  validateAndExtractTelegramUserData,
} from "../service/user";
import { BotToken } from "../constants";
import { User } from "../entity/User";

const authorize = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Parse the body as URLSearchParams
    const params = new URLSearchParams(Object.entries(body));

    // Extract the hash and validate it
    const hash = params.get("hash");
    if (!hash) {
      res.status(400).json({ success: false, message: "Hash is required" });
      return;
    }
    params.delete("hash");

    // Convert the remaining params into a plain object
    const data = {} as any;
    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    // Validate and extract Telegram user data
    let authUser;
    try {
      authUser = validateAndExtractTelegramUserData(data, BotToken, hash);
    } catch (err) {
      res.status(400).json({ success: false, message: (err as Error).message });
      return;
    }

    // Authorize user using a mock service
    try {
      const user = await authorizeByWebApp(authUser);
      res.json({ success: true, ...user });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }

    // the authorized user details
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user) {
      const userResonse = newUserResponse(user);
      res.json({ success: true, ...userResonse });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const fetchLeaderboard = async (req: Request, res: Response) => {
  try {
    // Get the leaderboard
    const level = parseInt(req.query.level as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const user = (req as any).user as User;

    // Mock leaderboard data
    const leaderboard = await getLeaderboard(level, user, limit, offset); // Replace with actual leaderboard fetching logic

    res.json({ success: true, ...leaderboard });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { authorize, getMe, fetchLeaderboard };
