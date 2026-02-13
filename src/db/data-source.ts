import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "todo",
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  logging: false,
  dropSchema: process.env.TYPEORM_DROP_SCHEMA === "true",
  entities: [__dirname + "/../entities/*.{ts,js}"],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  subscribers: [],
});
