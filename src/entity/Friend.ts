import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User"; // Assuming User is another entity

@Entity()
export class Friend {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  friendId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "friendId" }) // Specify the foreign key
  friend: User;

  @Column()
  reward: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
