import * as crypto from "crypto";
import { CardLevel } from "../entity/CardLevel";
import { UserCard } from "../entity/UserCard";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { generateRandomHex } from "../utils/generateRandomHex";
import { TelegramUser } from "../types/user";
import { Equal } from "typeorm";
import { EnergyTopUpPower, Leagues } from "../constants/user";

export function newUserResponse(user: User): Record<string, any> {
  return {
    id: Number(user.id),
    balance: Number(user.balance),
    first_name: user.firstName,
    energy: user.CurrentAvailableEnergy(), // Assuming you have this method
    max_energy: user.CurrentMaxEnergy(), // Assuming you have this method
    max_energy_level: user.maxEnergyLevel,
    mine_level: user.mineLevel,
    auto_farmer: user.autoFarmer,
    auto_farmer_profit: user.autoFarmerProfit ? Number(user.autoFarmerProfit) : 0,
    access_token: user.webAppAccessToken,
    access_token_expires_at: user.webAppAccessTokenExpiresAt,
    premium_expires_at: user.premiumExpiresAt,
    is_premium: Boolean(user.premiumExpiresAt && user.premiumExpiresAt > new Date()),
    last_mine_at: user.lastMineAt,
    daily_booster_available_at: user.dailyBoosterAvailableAt,
    daily_bonus_streak: user.dailyBonusStreak,
    league: user.FullCurrentLeague(), // Assuming you have this method
    next_league: user.FullNextLeague(), // Assuming you have this method
    current_league: user.league,
    total_leagues: Leagues.length, // Assuming you calculate this in your application
    profit_per_hour: user.autoFarmerProfit ? Number(user.autoFarmerProfit): 0,
    earn_per_tap: user.CurrentEarnPerTap(), // Assuming you have this method
    last_auto_farm_at: String(user.lastAutoFarmAt),
    latest_profit: Number(user.latestProfit),
  };
}

async function getUser(opts: any): Promise<User | null> {
  // Try to find the user
  let user = await AppDataSource.manager.findOne(User, { where: { id: opts.tgUser.id } });

  if (user) {
    // Update user properties if necessary
    const mustUpdate: Partial<User> = {};
    if (opts.IsPrivate && user.stoppedAt) {
      mustUpdate.stoppedAt = null;
    }
    if (opts.tgUser.firstName !== user.firstName) {
      mustUpdate.firstName = opts.tgUser.firstName;
    }
    if (opts.tgUser.username !== user.username) {
      mustUpdate.username = opts.tgUser.username;
    }
    if (opts.tgUser.languageCode && opts.tgUser.languageCode !== user.languageCode) {
      mustUpdate.languageCode = opts.tgUser.languageCode;
    }
    if (opts.tgUser.isPremium !== user.hasTelegramPremium) {
      mustUpdate.hasTelegramPremium = opts.tgUser.isPremium;
    }

    // Update user if there are changes
    if (Object.keys(mustUpdate).length > 0) {
      await AppDataSource.manager.update(User, user.id, mustUpdate);
    }

    return user;
  }

  // Create a new user if not found
  user = AppDataSource.manager.create(User, {
    id: opts.tgUser.id,
    firstName: opts.tgUser.firstName,
    username: opts.tgUser.username,
    languageCode: opts.tgUser.languageCode,
    hasTelegramPremium: opts.tgUser.isPremium,
  });

  // Save new user
  await AppDataSource.manager.save(user);

  return user;
}

const maxProfitHours = 3

export const getUserByAccessToken = async (accessToken) => {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { webAppAccessToken: accessToken } });
    if (!user) {
        throw new Error('User not found');
    }

    await processAutoFarmer(user);

    return user;
};

const processAutoFarmer = async (user: User) => {
    // Assuming you have some logic to calculate the AutoFarmerProfit
    user.autoFarmerProfit = await calculateFarmingProfit(user);

    const hoursFromLastMining = user.lastAutoFarmAt ? Math.min(
        (Date.now() - user.lastAutoFarmAt.getTime()) / (1000 * 60 * 60),
        maxProfitHours
      ) : 0;

    const mined = user.autoFarmerProfit * hoursFromLastMining;

    const secondsFromLastEnergy = user.lastEnergyAt ? (Date.now() - user.lastEnergyAt.getTime()) / 1000 : 0;
    const newEnergy = Math.max(0, user.energy - EnergyTopUpPower * secondsFromLastEnergy);

    const mustUpdate: any = {
        energy: newEnergy,
        lastEnergyAt: new Date(),
    };

    if (mined > 0) {
        mustUpdate.balance = user.balance + mined;
        mustUpdate.lastAutoFarmAt = new Date();
        mustUpdate.latestProfit = user.latestProfit + mined;
        user.lastAutoFarmAt = new Date();
        user.latestProfit += mined;
        user.balance += mined;
    }

    const nextLeagueID = await getNextLeague(user.balance + mined, user.league);
    if (user.league !== nextLeagueID && nextLeagueID !== 0) {
        mustUpdate.league = nextLeagueID - 1;
        user.league = nextLeagueID - 1;
    }

    await AppDataSource.getRepository(User).update(user.id, mustUpdate);

    user.lastEnergyAt = new Date();
    user.energy = newEnergy;
};

const calculateFarmingProfit = async (user: User): Promise<number> => {
    const result = await AppDataSource.getRepository(CardLevel)
        .createQueryBuilder('cardLevels')
        .select('SUM(cardLevels.totalFarming)', 'profit')
        .innerJoin(UserCard, 'uc', 'uc.cardId = cardLevels.cardId AND uc.levelId = cardLevels.id AND uc.userId = :userId', { userId: user.id })
        .getRawOne();

    return result ? parseInt(result.profit, 10) : 0;
};

export async function getNextLeague(balance: number, currentLeague: number) {
  const nextLeague = Leagues.find((league) => balance >= league.must_reach_balance && league.id > currentLeague);
  return nextLeague ? nextLeague.id : 0;
}

/**
 * Calculates the total farming profit for a user based on their cards.
 * @param {Object} user - The user object containing the user ID.
 * @returns {Promise<number>} - The total farming profit.
 */
export async function getFarmingProfit(user: TelegramUser) {
  try {
    const result = await AppDataSource.getRepository(CardLevel)
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
    if (user.avatarURL) {
      avatarURL = user.avatarURL;
    }

    // Get or create the user
    const userOptions = {
      tgUser: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        isPremium: user.hasTelegramPremium,
      },
      IsPrivate: true,
    };

    const fetchedUser = await getUser(userOptions);
    if (!fetchedUser) {
      throw new Error("Failed to fetch user");
    }

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
      webAppAccessToken: accessToken,
      webAppAccessTokenExpiresAt: expiresAt,
      avatarUrl: avatarURL,
      latestProfit: 0,
    };

    // Update user in the database
    await AppDataSource.getRepository(User)
      .update({ id: Equal(user.id) }, mustUpdate as any);

    const _user = await AppDataSource.getRepository(User).findOneBy({ id: user.ID });

    return newUserResponse(_user);

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
    id: telegramID,
    username: authData.username || undefined,
    firstName: authData.first_name || undefined,
    avatarURL: authData.avatar || undefined,
    hasTelegramPremium: !!authData.is_premium,
  };

  return user;
}
