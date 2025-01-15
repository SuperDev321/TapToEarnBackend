import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class ChannelMember {
  @PrimaryColumn()
  channelId!: number;

  @PrimaryColumn()
  userId!: number;

  @Column()
  status!: string;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
