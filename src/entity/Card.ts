import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { CardLevel } from "./CardLevel"; // Assuming CardLevel is another entity
import { UserCard } from "./UserCard";

@Entity()
@Index("IDX_NAME", ["name"], { unique: true })
export class Card {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: "bytea", nullable: true })
  logoFileBytes: Buffer;

  @Column({ type: "bytea", nullable: true })
  levelsFileBytes: Buffer;

  @Column({ nullable: true })
  logoS3Key: string;

  @OneToMany(() => CardLevel, (cardLevel) => cardLevel.card)
  cardLevels: CardLevel[];

  @OneToMany(() => UserCard, (cardLevel) => cardLevel.card)
  userCards: UserCard[];

  @Column()
  createdAt: Date;

  @Column()
  category: string;

  @Column()
  description: string;
}
