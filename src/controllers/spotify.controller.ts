import { Request, Response } from "express";
import { generateRandomString } from "@/middleware/crypto.js";
import spotifyService from "@/services/spotify.service.js";
import prisma from "@/db/prisma.js";
import { env } from "@/config/env.js";

const STATE_KEY = "spotify_auth_state";

const login = async (_req: Request, res: Response) => {
  const scope = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
  ].join(" ");

  const state = generateRandomString(16);

  res.cookie(STATE_KEY, state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.SPOTIFY.CLIENT_ID,
    scope,
    redirect_uri: env.SPOTIFY.REDIRECT_URI,
    state: state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
};

const callback = async (req: Request, res: Response) => {
  const code = (req.query.code as string) || null;
  const state = (req.query.state as string) || null;
  const storedState = req.cookies ? req.cookies[STATE_KEY] : null;

  if (!code) return res.status(400).send("No code provided");

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        new URLSearchParams({
          error: "state_mismatch",
        })
    );
  }

  res.clearCookie(STATE_KEY);

  try {
    const tokens = await spotifyService.exchangeCodeForTokens(code);

    const profile = await spotifyService.getProfile(tokens.access_token);

    let user = await prisma.user.findUnique({
      where: { spotifyUserId: profile.id },
    });
    if (!user) {
      user = await prisma.user.create({ data: { spotifyUserId: profile.id } });
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(env.FRONTEND_URL!);
  } catch (err) {
    console.error(err);
    res.status(500).send("Spotify API error");
  }
};

const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await spotifyService.getProfile(req.accessToken!);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const getPlaylists = async (req: Request, res: Response) => {
  try {
    const playlists = await spotifyService.getUserPlaylists(req.accessToken!);
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
};

export default { login, callback, getProfile, getPlaylists };
