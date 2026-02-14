import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Task } from "./Task";



@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  name: string;

  @Column()
  user_id: string;

  @Column({ type: "varchar", nullable: true })
  icon: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  description: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // estasblish relationship here

  // with user ,  one user can have at one or many category

  @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  // with Task, task can have atmost one category
  // one category can have many tasks

  @OneToMany(() => Task, (task) => task.category)
  tasks: Task[];
}
