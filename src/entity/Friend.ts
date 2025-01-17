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
  @PrimaryColumn({ type: "bigint", unsigned: true })
  userId!: number;

  @PrimaryColumn({ type: "bigint", unsigned: true })
  friendId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "friend_id" }) // Specify the foreign key
  friend!: User;

  @Column()
  reward!: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
