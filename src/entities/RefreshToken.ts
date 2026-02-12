import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ unique: true })
  token_hash: string;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "timestamp", nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
