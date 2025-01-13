import * as crypto from "crypto";
import { CardLevel } from "../entity/CardLevel";
import { UserCard } from "../entity/UserCard";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { generateRandomHex } from "../utils/generateRandomHex";
import { TelegramUser } from "../types/user";

const { getRepository } = require("typeorm");

/**
 * Calculates the total farming profit for a user based on their cards.
 * @param {Object} user - The user object containing the user ID.
 * @returns {Promise<number>} - The total farming profit.
 */
export async function getFarmingProfit(user: TelegramUser) {
  try {
    const result = await getRepository(CardLevel)
      .createQueryBuilder("card_levels")
      .select("SUM(card_levels.total_farming)", "profit")
      .innerJoin(
        UserCard,
        "uc",
        "uc.card_id = card_levels.card_id AND uc.level_id = card_levels.id AND uc.user_id = :userId",
        {
          userId: user.ID,
        }
      )
      .getRawOne();

    return result.profit ? parseInt(result.profit, 10) : 0;
  } catch (err) {
    console.error("Error fetching farming profit:", err.message);
    throw new Error(`Failed to calculate farming profit: ${err.message}`);
  }
}
/**
 * Authorizes a Telegram WebApp user.
 * @param {Object} user - The user object to authorize.
 * @param {Object} services - Services required for authorization (e.g., DB, UserService).
 * @returns {Promise<void>} - Resolves on success, rejects on failure.
 */
export async function authorizeByWebApp(user) {
  try {
    let avatarURL = null;
    if (user.AvatarURL) {
      avatarURL = user.AvatarURL;
    }

    // Get or create the user
    const userOptions = {
      TgUser: {
        Id: user.ID,
        FirstName: user.FirstName,
        Username: user.Username,
        IsPremium: user.HasTelegramPremium,
      },
      IsPrivate: true,
    };

    // const fetchedUser = await getUser(userOptions);
    // if (!fetchedUser) {
    //   throw new Error("Failed to fetch user");
    // }

    // // Process the auto farmer logic
    // try {
    //   await processAutoFarmer(fetchedUser);
    // } catch (err) {
    //   throw new Error(`Process auto farmer: ${err.message}`);
    // }

    // // Update user details
    // Object.assign(user, fetchedUser);
    // const latestProfit = fetchedUser.LatestProfit;

    // // Generate access token
    const accessToken = await generateRandomHex(64);

    const lastAuthAt = new Date();
    const expiresAt = new Date(lastAuthAt.getTime() + 60 * 60 * 1000); // 1 hour later

    const mustUpdate = {
      web_app_access_token: accessToken,
      web_app_access_token_expires_at: expiresAt,
      avatar_url: avatarURL,
      latest_profit: 0,
    };

    // Update user in the database
    await AppDataSource.manager
      .getRepository(User)
      .update({ id: user.ID }, mustUpdate as any);

    // Restore the latest profit
    // user.LatestProfit = latestProfit;
  } catch (err) {
    console.error("Error authorizing user:", err.message);
    throw err;
  }
}

export function validateAndExtractTelegramUserData(
  authData,
  secret,
  signature
) {
  // Create data check string
  const dataCheckArr = Object.keys(authData)
    .map((key) => `${key}=${authData[key]}`)
    .sort();
  const dataCheckString = dataCheckArr.join("\n");

  // Compute HMAC
  const webAppKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(secret)
    .digest();
  const calculatedHmac = crypto
    .createHmac("sha256", webAppKey)
    .update(dataCheckString)
    .digest("hex");

  // Compare calculated signature with the provided one
  if (calculatedHmac !== signature) {
    throw new Error(`Invalid auth signature, given: ${signature}`);
  }

  // Parse user data
  let userFields;
  if (authData.user) {
    try {
      userFields = JSON.parse(authData.user);
    } catch {
      throw new Error("Invalid auth data");
    }

    Object.entries(userFields).forEach(([key, value]) => {
      if (typeof value === "number") {
        authData[key] = value.toString();
      } else {
        authData[key] = `${value}`;
      }
    });
  }

  // Validate Telegram ID and auth date
  const telegramID = parseInt(authData.id, 10);
  if (isNaN(telegramID)) {
    throw new Error("Invalid Telegram ID in auth data");
  }

  const authDate = parseInt(authData.auth_date, 10);
  if (isNaN(authDate) || Date.now() / 1000 - authDate > 86400) {
    throw new Error("Auth token expired");
  }

  // Construct user object
  const user = {
    ID: telegramID,
    Username: authData.username || undefined,
    FirstName: authData.first_name || undefined,
    AvatarURL: authData.avatar || undefined,
    HasTelegramPremium: !!authData.is_premium,
  };

  return user;
}
