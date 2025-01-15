import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class League {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  must_reach_balance!: number;

  @Column()
  name!: string;

  @Column()
  reward!: number;

  @Column()
  points_per_tap!: number;

  @Column()
  max_energy!: number;
}
