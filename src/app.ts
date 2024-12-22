import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

// NOTE: loading the env
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

connectDB();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something broke!",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.use("/api/v1", (req: Request, res: Response) => {
  res.json({
    message: "API is working!",
  });
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});

export default app;
