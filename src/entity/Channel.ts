import { Entity, PrimaryColumn, Column, Index } from "typeorm";
import { QuestType } from "../constants/channel";

@Entity()
export class Channel {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  inviteLink: string;

  @Column({ default: 0 })
  balance: number;

  @Column({ default: 1000 })
  reward: number;

  @Column({ default: false })
  @Index()
  activated: boolean;

  @Column({
    type: "enum",
    enum: QuestType,
    default: QuestType.Telegram,
  })
  questType: QuestType;

  @Column({ default: false })
  isHighlighted: boolean;

  @Column()
  languageCode: string;

  @Column({ type: "timestamp", nullable: true })
  stoppedAt: Date | null;
}
