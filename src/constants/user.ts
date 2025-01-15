import { League } from "../entity/League";

export const MaxBoosterLevel = 30;
export const EnergyTopUpPower = 3;
export const FriendReward = 10000;
export const PremiumFriendReward = 25000;

export const Leagues: League[] = [
  {
    id: 1,
    must_reach_balance: 0,
    name: "Normie",
    reward: 0,
    points_per_tap: 1,
    max_energy: 10,
  },
  {
    id: 2,
    must_reach_balance: 1000,
    name: "Beginner Hodler",
    reward: 0,
    points_per_tap: 2,
    max_energy: 20,
  },
  {
    id: 3,
    must_reach_balance: 5000,
    name: "Miner",
    reward: 0,
    points_per_tap: 3,
    max_energy: 30,
  },
  {
    id: 4,
    must_reach_balance: 25_000,
    name: "Altcoin Explorer",
    reward: 0,
    points_per_tap: 4,
    max_energy: 40,
  },
  {
    id: 5,
    must_reach_balance: 100_000,
    name: "Liquid staker",
    reward: 0,
    points_per_tap: 5,
    max_energy: 50,
  },
  {
    id: 6,
    must_reach_balance: 500_000,
    name: "Yield farmer",
    reward: 0,
    points_per_tap: 6,
    max_energy: 60,
  },
  {
    id: 7,
    must_reach_balance: 1_000_000,
    name: "Average meme lover",
    reward: 0,
    points_per_tap: 7,
    max_energy: 70,
  },
  {
    id: 8,
    must_reach_balance: 10_000_000,
    name: "Airdrop hunter",
    reward: 0,
    points_per_tap: 8,
    max_energy: 80,
  },
  {
    id: 9,
    must_reach_balance: 100_000_000,
    name: "Degen",
    reward: 0,
    points_per_tap: 9,
    max_energy: 90,
  },
  {
    id: 10,
    must_reach_balance: 500_000_000,
    name: "Master degen",
    reward: 0,
    points_per_tap: 10,
    max_energy: 100,
  },
];
