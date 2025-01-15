import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User"; // Assuming User is another entity

@Entity()
export class MiningPerDay {
  @PrimaryColumn({ type: "date" })
  date!: Date;

  @PrimaryColumn({ type: "bigint", unsigned: true })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" }) // Specify the foreign key
  user!: User;

  @Column()
  league!: number;

  @Column()
  mined!: number;
}

@Entity()
export class MiningPerMonth {
  @PrimaryColumn({ type: "date" })
  date!: Date;

  @PrimaryColumn({ type: "bigint", unsigned: true })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" }) // Specify the foreign key
  user!: User;

  @Column()
  league!: number;

  @Column()
  mined!: number;
}
