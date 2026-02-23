import { Request, Response } from "express";
import { generateRandomString } from "@/middleware/crypto.js";
import spotifyService from "@/services/spotify.service.js";
import { env } from "@/config/env.js";
import { SpotifyAuthState } from "@/types/spotify.js";

const STATE_KEY = "spotify_auth_state";

const login = async (req: Request, res: Response) => {
  const { frontendUrl } = req.query;

  if (env.ALLOWED_ORIGINS.indexOf(frontendUrl as string) === -1) {
    return res.status(400).send("Invalid frontend URL");
  }

  const scope = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
  ].join(" ");

  const state: SpotifyAuthState = {
    key: generateRandomString(16),
    frontendUrl: frontendUrl as string,
  };

  res.cookie(STATE_KEY, state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.SPOTIFY.CLIENT_ID,
    scope,
    redirect_uri: env.SPOTIFY.REDIRECT_URI,
    state: state.key,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
};

const callback = async (req: Request, res: Response) => {
  const code = (req.query.code as string) || null;
  const state = (req.query.state as string) || null;
  const storedState = (
    req.cookies ? req.cookies[STATE_KEY] : null
  ) as SpotifyAuthState | null;

  if (!code) return res.status(400).send("No code provided");

  if (state === null || storedState === null || state !== storedState.key) {
    return res.redirect(
      "/#" +
        new URLSearchParams({
          error: "state_mismatch",
        }),
    );
  }

  res.clearCookie(STATE_KEY);

  try {
    const session = await spotifyService.createOrUpdateSessionFromCode(code);

    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(storedState.frontendUrl + "/dashboard");
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

const logout = async (req: Request, res: Response) => {
  const sessionId = req.cookies.sessionId;

  try {
    await spotifyService.revokeSession(sessionId);
  } catch (err) {
    console.error("Failed to revoke session:", err);
  }

  res.clearCookie("sessionId");
  res.status(200).json({ message: "Logged out" });
};

export default { login, callback, getProfile, getPlaylists, logout };
