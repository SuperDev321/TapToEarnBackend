import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class DailyBonus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reward: number;

  // Fields that are not persisted in the database can be marked with @Column({ select: false }) or excluded entirely.
  claimed: boolean;

  current: boolean;
}
