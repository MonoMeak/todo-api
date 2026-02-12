import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "sokmeak1376",
  database: process.env.DB_NAME || "todo",
  synchronize: true, // Auto-create tables (disable in production)
  logging: false,
  dropSchema: false, // Set to true to drop the schema on every application launch (useful for development)
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
});
