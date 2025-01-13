import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { Card } from "./Card"; // Assuming Card is the related entity

@Entity()
export class CardLevel {
  @PrimaryColumn()
  id: number;

  @PrimaryColumn()
  cardId: number;

  @Column({ type: "numeric" })
  cost: string;

  @Column()
  farmingUpgrade: number;

  @Column()
  totalFarming: number;

  @ManyToOne(() => Card, (card) => card.cardLevels)
  card: Card;
}
