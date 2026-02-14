import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column({ nullable: true })
  category_id: string | null;

  @Column()
  text: string;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ nullable: true, type: "timestamp" })
  completed_at: Date | null;

  @Column({ nullable: true, type: "timestamp" })
  end_date: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  // with category

  @ManyToOne(() => Category, (category) => category.tasks, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category: Category | null;
}
