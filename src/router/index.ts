import { Router } from "express";
import { authorize, fetchLeaderboard, getMe } from "../controller/user";
import { userMiddleware } from "../middleware/user";
import { mine } from "../controller/mine";
import { getLeagues } from "../controller/league";
import { fetchBoosts, updateBoosts } from "../controller/boosts";
import { fetchCards, purchaseCard } from "../controller/card";
import { claimDailyBonus, fetchDailyBonuses } from "../controller/dailyBonus";
import { fetchFriends } from "../controller/friend";

const router = Router();

router.post("/authorize", authorize);
router.get("/getMe", userMiddleware, getMe);
router.get("/leagues", getLeagues);

router.get("/leaderboard", userMiddleware, fetchLeaderboard);

router.get("/boosts", userMiddleware, fetchBoosts);
router.post("/boosts", userMiddleware, updateBoosts);

router.post("/mine", userMiddleware, mine);

router.get("/cards", userMiddleware, fetchCards);
router.post("/cards", userMiddleware, purchaseCard);

router.get("/getDailyBonuses", userMiddleware, fetchDailyBonuses);
router.post("/pickDailyBonus", userMiddleware, claimDailyBonus);

router.get("/friends", userMiddleware, fetchFriends);

export default router;
