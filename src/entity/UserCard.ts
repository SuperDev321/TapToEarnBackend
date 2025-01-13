import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User"; // Assuming User is the related entity
import { Card } from "./Card"; // Assuming Card is the related entity

@Entity()
export class UserCard {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  cardId: number;

  @Column({ default: 1 })
  levelId: number;

  @ManyToOne(() => User, (user) => user.userCards)
  user: User;

  @ManyToOne(() => Card, (card) => card.userCards)
  card: Card;
}