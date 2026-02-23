import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import spotifyRouter from "@/routers/spotify.router.js";
import { env } from "@/config/env.js";
import morgan from "morgan";

const app = express();

const WHITELIST = env.ALLOWED_ORIGINS;
var corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, origin?: boolean) => void,
  ) {
    if (!origin) return callback(null, true);

    if (WHITELIST.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ cookies: req.headers.cookie ?? null });
});

app.use("/auth/spotify", spotifyRouter);

export { app };
