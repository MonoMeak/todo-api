import express from "express";
import { Request, Response } from "express";
import { AppDataSource } from "./src/db/data-source";
import cookieParser from "cookie-parser";
import taskRoutes from "./src/routes/tasks";
import authRoutes from "./src/routes/auth";
import cors from "cors";

const app = express();

const parseAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.CORS_ORIGINS;
  if (!configuredOrigins) {
    return ["http://localhost:8080"];
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

app.use(
  cors({
    origin: parseAllowedOrigins(),
    credentials: true,
  }),
);
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(loggerMiddleware); // Apply the logger middleware globally

// map the routes

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// the entry point of the application!

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// Connect to PostgreSQL database
// Create Model and Controller for Todo
// Create Routes for Todo

// Module: User, Todo

// Initialize database connection
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully!");

    app.listen(port, () => {
      console.log(`Server is running on port:${port} `);
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

// setup global middleware that act as logger for all routes

function loggerMiddleware(req: Request, res: Response, next: Function) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

startServer();
