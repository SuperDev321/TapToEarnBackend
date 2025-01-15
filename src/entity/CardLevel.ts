import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card"; // Assuming Card is the related entity

@Entity("card_levels")
export class CardLevel {
  @PrimaryGeneratedColumn()
  id!: number;

  @PrimaryColumn()
  cardId!: number;

  @Column()
  level!: number;

  @Column({ type: "numeric" })
  cost!: string;

  @Column()
  farmingUpgrade!: number;

  @Column()
  totalFarming!: number;

  @ManyToOne(() => Card, (card) => card.cardLevels)
  card!: Card;
}
