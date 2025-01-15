import * as crypto from "crypto";
import { CardLevel } from "../entity/CardLevel";
import { UserCard } from "../entity/UserCard";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { generateRandomHex } from "../utils/generateRandomHex";
import { TelegramUser } from "../types/user";
import { Equal } from "typeorm";
import {
  EnergyTopUpPower,
  FriendReward,
  Leagues,
  PremiumFriendReward,
} from "../constants/user";
import { Friend } from "../entity/Friend";
import { Promo } from "../entity/Promo";
import { Context } from "telegraf";

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
    auto_farmer_profit: user.autoFarmerProfit
      ? Number(user.autoFarmerProfit)
      : 0,
    access_token: user.webAppAccessToken,
    access_token_expires_at: user.webAppAccessTokenExpiresAt,
    premium_expires_at: user.premiumExpiresAt,
    is_premium: Boolean(
      user.premiumExpiresAt && user.premiumExpiresAt > new Date()
    ),
    last_mine_at: user.lastMineAt,
    daily_booster_available_at: user.dailyBoosterAvailableAt,
    daily_bonus_streak: user.dailyBonusStreak,
    league: user.FullCurrentLeague(), // Assuming you have this method
    next_league: user.FullNextLeague(), // Assuming you have this method
    current_league: user.league,
    total_leagues: Leagues.length, // Assuming you calculate this in your application
    profit_per_hour: user.autoFarmerProfit ? Number(user.autoFarmerProfit) : 0,
    earn_per_tap: user.CurrentEarnPerTap(), // Assuming you have this method
    last_auto_farm_at: String(user.lastAutoFarmAt),
    latest_profit: Number(user.latestProfit),
  };
}

export async function updateUserAvatar(
  user: User,
  avatarURL: string
): Promise<void> {}

export function getUserFromContext(ctx: Context): User {
  const user = ctx.state.user as User;
  if (!user) {
    throw new Error("no user in context");
  }
  return user;
}

export async function getUser(opts: any): Promise<User> {
  // Try to find the user
  let user = await AppDataSource.manager.findOne(User, {
    where: { id: opts.tgUser.id },
  });

  if (user) {
    // Update user properties if necessary
    const mustUpdate: Partial<User> = {};
    if (opts.IsPrivate && user.stoppedAt) {
      mustUpdate.stoppedAt = null;
    }
    if (opts.tgUser.first_name && opts.tgUser.first_name !== user.firstName) {
      mustUpdate.firstName = opts.tgUser.first_name;
    }
    if (opts.tgUser.username && opts.tgUser.username !== user.username) {
      mustUpdate.username = opts.tgUser.username;
    }
    if (
      opts.tgUser.language_code &&
      opts.tgUser.language_code !== user.languageCode
    ) {
      mustUpdate.languageCode = opts.tgUser.language_code;
    }
    if (
      opts.tgUser.is_premium &&
      opts.tgUser.is_premium !== user.hasTelegramPremium
    ) {
      mustUpdate.hasTelegramPremium = opts.tgUser.is_premium;
    }

    // Update user if there are changes
    if (Object.keys(mustUpdate).length > 0) {
      await AppDataSource.manager.update(User, user.id, mustUpdate);
    }

    return user;
  }

  user = new User();

  user.id = opts.tgUser.id;
  user.firstName = opts.tgUser.first_name;
  user.username = opts.tgUser.username;
  user.languageCode = opts.tgUser.language_code;
  user.hasTelegramPremium = opts.tgUser.is_premium;

  let friendReward: Friend | null = null;

  if (opts.promo) {
    if ((opts.promo as string).startsWith("r_")) {
      const referrerId = parseInt((opts.promo as string).slice(2), 10);
      const referrer = await AppDataSource.manager.findOne(User, {
        where: { id: Equal(referrerId) },
      });
      if (referrer) {
        user.refererId = referrerId;
        const reward = opts.tgUser.is_premium
          ? PremiumFriendReward
          : FriendReward;

        friendReward = new Friend();
        friendReward.userId = referrer.id;
        friendReward.friendId = opts.tgUser.id;
        friendReward.reward = reward;

        const newBalance = Number(referrer.balance) + Number(reward);

        const nextLeagueID = await getNextLeague(newBalance, referrer.league);
        referrer.referralProfit = reward;
        referrer.balance = newBalance;

        if (referrer.league !== nextLeagueID - 1 && nextLeagueID !== 0) {
          referrer.league = nextLeagueID - 1;
        }
        await AppDataSource.manager.save(referrer);
        user.balance = reward;

        const nextLeagueIDOfUser = await getNextLeague(reward, user.league);

        if (
          user.league !== nextLeagueIDOfUser - 1 &&
          nextLeagueIDOfUser !== 0
        ) {
          user.league = nextLeagueIDOfUser - 1;
        }
      } else {
        const promo = await AppDataSource.getRepository(Promo).findOneBy({
          name: Equal(opts.promo),
        });
        if (promo) {
          user.promoId = promo?.id ?? null;
          user.balance = promo.charge;
        }
      }
    }
  }
  // Save new user
  user = await AppDataSource.manager.save(user);
  if (friendReward) {
    await AppDataSource.manager.save(friendReward);
  }
  return user;
}

const maxProfitHours = 3;

export const getUserByAccessToken = async (accessToken: string) => {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { webAppAccessToken: accessToken },
  });
  if (!user) {
    throw new Error("User not found");
  }

  await processAutoFarmer(user);

  return user;
};

const processAutoFarmer = async (user: User) => {
  // Assuming you have some logic to calculate the AutoFarmerProfit
  user.autoFarmerProfit = await calculateFarmingProfit(user);

  const hoursFromLastMining = user.lastAutoFarmAt
    ? Math.min(
        Math.floor(
          (Date.now() - user.lastAutoFarmAt.getTime()) / (1000 * 60 * 60)
        ),
        maxProfitHours
      )
    : 0;

  const mined = user.autoFarmerProfit * hoursFromLastMining;

  const secondsFromLastEnergy = user.lastEnergyAt
    ? Math.floor((Date.now() - user.lastEnergyAt.getTime()) / 1000)
    : 0;
  const newEnergy = Math.max(
    0,
    user.energy - EnergyTopUpPower * secondsFromLastEnergy
  );

  user.lastEnergyAt = new Date();
  user.energy = newEnergy;

  if (mined > 0) {
    user.lastAutoFarmAt = new Date();
    user.latestProfit = (user.latestProfit ?? 0) + mined;
    user.balance += mined;
  }

  const nextLeagueID = await getNextLeague(user.balance + mined, user.league);
  if (user.league !== nextLeagueID - 1 && nextLeagueID !== 0) {
    user.league = nextLeagueID - 1;
  }

  await AppDataSource.manager.save(user);
};

const calculateFarmingProfit = async (user: User): Promise<number> => {
  const result = await AppDataSource.getRepository(CardLevel)
    .createQueryBuilder("cardLevels")
    .select("SUM(cardLevels.totalFarming)", "profit")
    .innerJoin(
      UserCard,
      "uc",
      "uc.cardId = cardLevels.cardId AND uc.levelId = cardLevels.id AND uc.userId = :userId",
      { userId: user.id }
    )
    .getRawOne();

  return result ? parseInt(result.profit ?? 0, 10) : 0;
};

export async function getNextLeague(balance: number, currentLeague: number) {
  const nextLeague = Leagues.find(
    (league) =>
      balance >= league.must_reach_balance && league.id > currentLeague
  );
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
          userId: user.id,
        }
      )
      .getRawOne();

    return result.profit ? parseInt(result.profit, 10) : 0;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to calculate farming profit: ${err.message}`);
    } else {
      throw new Error("Failed to calculate farming profit: Unknown error");
    }
  }
}
/**
 * Authorizes a Telegram WebApp user.
 * @param {Object} user - The user object to authorize.
 * @param {Object} services - Services required for authorization (e.g., DB, UserService).
 * @returns {Promise<void>} - Resolves on success, rejects on failure.
 */
interface AuthorizeUserOptions {
  tgUser: {
    id: number;
    firstName: string;
    username?: string;
    isPremium: boolean;
  };
  IsPrivate: boolean;
}

interface MustUpdate {
  webAppAccessToken: string;
  webAppAccessTokenExpiresAt: Date;
  avatarUrl: string | null;
  latestProfit: number;
}

export async function authorizeByWebApp(
  user: TelegramUser
): Promise<Record<string, any>> {
  try {
    let avatarURL: string | null = null;
    if (user.avatarURL) {
      avatarURL = user.avatarURL;
    }

    // Get or create the user
    const userOptions: AuthorizeUserOptions = {
      tgUser: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        isPremium: user.hasTelegramPremium,
      },
      IsPrivate: true,
    };

    const fetchedUser: User | null = await getUser(userOptions);
    if (!fetchedUser) {
      throw new Error("Failed to fetch user");
    }

    // Generate access token
    const accessToken: string = await generateRandomHex(64);

    const lastAuthAt: Date = new Date();
    const expiresAt: Date = new Date(lastAuthAt.getTime() + 60 * 60 * 1000); // 1 hour later

    const mustUpdate: MustUpdate = {
      webAppAccessToken: accessToken,
      webAppAccessTokenExpiresAt: expiresAt,
      avatarUrl: avatarURL,
      latestProfit: 0,
    };

    // Update user in the database
    await AppDataSource.getRepository(User).update(
      { id: Equal(user.id) },
      mustUpdate as any
    );

    const _user: User | null = await AppDataSource.getRepository(
      User
    ).findOneBy({
      id: user.id,
    });

    if (!_user) {
      throw new Error("User not found after update");
    }

    return newUserResponse(_user);
  } catch (err) {
    console.error("Error authorizing user:", (err as Error).message);
    throw err;
  }
}

export function validateAndExtractTelegramUserData(
  authData: Record<string, any>,
  secret: string,
  signature: string
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

const getUserLeaderboardPosition = async (
  userId: number,
  league: number,
  limit: number,
  offset: number
) => {
  const leaderboardQuery = `
    WITH TotalFarmingByLeague AS (
        SELECT 
            SUM(total_farming) AS profit, 
            user_cards.user_id, 
            u.league
        FROM 
            user_cards
        JOIN 
            card_levels cl ON cl.card_id = user_cards.card_id AND cl.id = user_cards.level_id
        JOIN 
            users u ON user_cards.user_id = u.id
        WHERE 
            u.banned_at IS NULL
        GROUP BY 
            user_cards.user_id, u.league
    ),
    Leaderboard AS (
        SELECT 
            u.id,
            tf.profit,
            u.league,
            u.username,
            u.first_name,
            u.avatar_url,
            RANK() OVER (ORDER BY tf.profit DESC, u.username) AS position
        FROM 
            TotalFarmingByLeague tf
        JOIN 
            users u ON tf.user_id = u.id
        WHERE 
            ($1::smallint = 0 OR tf.league = $2)
    )
    SELECT 
        *
    FROM 
        Leaderboard
    WHERE 
        ($3::bigint = 0 OR id = $4)
    ORDER BY 
        profit DESC
    LIMIT 
        $5 OFFSET $6;
  `;

  const users = await AppDataSource.manager.query(leaderboardQuery, [
    league,
    league,
    userId,
    userId,
    limit,
    offset,
  ]);
  return users;
};

export const getLeaderboard = async (
  league: number,
  user: User,
  limit: number,
  offset: number
): Promise<{ players: User[]; me?: User }> => {
  const users = await getUserLeaderboardPosition(0, league, limit, offset);

  const result: { players: User[]; me?: User } = { players: users };

  if (league !== user.league && league !== 0) {
    return result;
  }

  let me: User | undefined;
  for (const u of users) {
    if (u.id === user.id) {
      me = u;
      break;
    }
  }

  if (!me) {
    const userPosition = await getUserLeaderboardPosition(
      user.id,
      league,
      1,
      0
    );
    if (userPosition.length > 0) {
      me = userPosition[0];
    }
  }

  result.me = me;
  return result;
};
