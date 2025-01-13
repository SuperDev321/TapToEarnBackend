import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class Promo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  price: number;

  @Column()
  charge: number;

  @Column({ default: 0 })
  premiumMinutes: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
