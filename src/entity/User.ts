import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { UserCard } from "./UserCard";

@Entity("users")
export class User {
  @PrimaryColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 255 })
  firstName: string;

  @Column({ type: "varchar", length: 255 })
  username: string;

  @Column({ type: "boolean", default: false })
  hasTelegramPremium: boolean;

  @Column({ type: "varchar", length: 50 })
  role: string; // Use an enum if you have a defined set of roles

  @Column({ type: "varchar", nullable: true })
  banReason: string | null;

  @Column({ type: "bigint", nullable: true })
  promoId: number | null;

  @Column({ type: "varchar", nullable: true })
  botState: string | null;

  @Column({ type: "varchar", nullable: true })
  botStateContext: string | null;

  @Column({ type: "bigint", default: 0 })
  balance: number;

  @Column({ type: "int", default: 0 })
  energy: number;

  @Column({ type: "int", default: 1 })
  energyLevel: number;

  @Column({ type: "int", default: 0 })
  maxEnergyLevel: number;

  @Column({ type: "int", default: 0 })
  mineLevel: number;

  @Column({ type: "varchar", nullable: true })
  avatarUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  webAppAccessToken: string | null;

  @Column({ type: "bigint", nullable: true })
  refererId: number | null;

  @Column({ type: "bigint", default: 0 })
  referralProfit: number;

  @Column({ type: "decimal", precision: 20, scale: 5, default: 0 })
  referralProfitUsd: string;

  @Column({ type: "varchar", length: 10 })
  languageCode: string;

  @Column({ type: "boolean", default: false })
  autoFarmer: boolean;

  @Column({ type: "bigint", nullable: true })
  autoFarmerProfit: number | null; // Transient column, not stored in DB

  @Column({ type: "decimal", precision: 20, scale: 5, default: 0 })
  balanceUsd: string;

  @Column({ type: "varchar", nullable: true })
  phoneNumber: string | null;

  @Column({ type: "timestamp", nullable: true })
  premiumExpiresAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  webAppAccessTokenExpiresAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  stoppedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  bannedAt: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastEnergyAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastMineAt: Date;

  @Column({ type: "timestamp", nullable: true })
  lastAutoFarmAt: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  dailyBoosterAvailableAt: Date;

  @Column({ type: "int", default: 0 })
  league: number;

  @Column({ type: "timestamp", nullable: true })
  lastDailyBonusAt: Date | null;

  @Column({ type: "int", default: 0 })
  dailyBonusStreak: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Column({ type: "bigint", default: 0 })
  latestProfit: number;

  isPremium(): boolean {
    return this.hasTelegramPremium;
  }

  @OneToMany(() => UserCard, (userCard) => userCard.user)
  userCards: UserCard[];
}
