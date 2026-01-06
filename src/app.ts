import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

dotenv.config();

const generateRandomString = (length: number) => {
  return randomBytes(60).toString("hex").slice(0, length);
};

app.get("/health", (req, res) => {
  res.status(200).json({ cookies: req.headers.cookie ?? null });
});

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = "http://127.0.0.1:3000/auth/spotify/callback";
var stateKey = "spotify_auth_state";

app.get("/auth/spotify/login", (_req, res) => {
  const scope = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
  ].join(" ");

  var state = generateRandomString(16);
  console.log("state:", state);

  res.cookie(stateKey, state, {
    httpOnly: true,
    secure: false, // set true in production
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get("/auth/spotify/callback", async (req, res) => {
  console.log("req.query:", req.query);
  console.log("req.cookies:", req.cookies);

  const code = (req.query.code as string) || null;
  const state = (req.query.state as string) || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (!code) return res.status(400).send("No code provided");

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        new URLSearchParams({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
      json: true,
    };

    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // 2. Use access token to call Spotify API
    const meResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log(meResponse.data);

    // 3. Redirect back to frontend
    res.redirect(
      "http://localhost:5173/#" +
        new URLSearchParams({
          access_token,
          refresh_token,
        }).toString()
    );
  }
});

export { app };
