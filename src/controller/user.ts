import { Request, Response } from "express";
import {
  authorizeByWebApp,
  validateAndExtractTelegramUserData,
} from "../service/user";
import { BotToken } from "../constants";

const authorize = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Parse the body as URLSearchParams
    const params = new URLSearchParams(Object.entries(body));

    // Extract the hash and validate it
    const hash = params.get("hash");
    if (!hash) {
      return res
        .status(400)
        .json({ success: false, message: "Hash is required" });
    }
    params.delete("hash");

    // Convert the remaining params into a plain object
    const data = {} as any;
    for (const [key, value] of params.entries() as any) {
      data[key] = value;
    }

    console.log("Received Data:", data);

    // Validate and extract Telegram user data
    let authUser;
    try {
      authUser = validateAndExtractTelegramUserData(data, BotToken, hash);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Authorize user using a mock service
    try {
      await authorizeByWebApp(authUser);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    // Return the authorized user details
    return res.json({ success: true, user: authUser });
  } catch (err) {
    console.error("Unexpected Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
export { authorize };
