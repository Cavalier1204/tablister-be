import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import spotifyRouter from "@/routers/spotify.router.js";
import { env } from "@/config/env.js";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ cookies: req.headers.cookie ?? null });
});

app.use("/auth/spotify", spotifyRouter);

export { app };
