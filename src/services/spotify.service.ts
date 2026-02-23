import axios from "axios";
import { env } from "@/config/env.js";
import prisma from "@/config/prisma.js";

const exchangeCodeForTokens = async (code: string) => {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      code,
      redirect_uri: env.SPOTIFY.REDIRECT_URI,
      grant_type: "authorization_code",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            env.SPOTIFY.CLIENT_ID + ":" + env.SPOTIFY.CLIENT_SECRET,
          ).toString("base64"),
      },
    },
  );

  return response.data; // access_token, refresh_token, expires_in
};

const refreshAccessToken = async (refreshToken: string) => {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            env.SPOTIFY.CLIENT_ID + ":" + env.SPOTIFY.CLIENT_SECRET,
          ).toString("base64"),
      },
    },
  );

  return response.data; // new access_token, expires_in
};

const revokeSession = async (sessionId: string) => {
  if (!sessionId) return null;

  return prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const getValidAccessToken = async (sessionId: string) => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt) throw new Error("Invalid session");

  const now = new Date();
  if (!session.accessToken || !session.expiresAt || session.expiresAt < now) {
    try {
      const refreshed = await refreshAccessToken(session.refreshToken);

      let refreshToken = session.refreshToken;
      if (refreshed.refresh_token) {
        refreshToken = refreshed.refresh_token;
      }

      const accessToken = refreshed.access_token;
      await prisma.session.update({
        where: { id: session.id },
        data: {
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400 || error.response?.status === 401) {
          await revokeSession(sessionId);
        }
      }
      throw new Error("Session expired or revoked");
    }
  }

  return session.accessToken;
};

const createOrUpdateSessionFromCode = async (code: string) => {
  const tokens = await exchangeCodeForTokens(code);
  const profile = await getProfile(tokens.access_token);

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

  return session;
};

const getProfile = async (accessToken: string) => {
  const response = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

async function getUserPlaylists(accessToken: string) {
  const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export default {
  exchangeCodeForTokens,
  refreshAccessToken,
  getValidAccessToken,
  createOrUpdateSessionFromCode,
  revokeSession,
  getProfile,
  getUserPlaylists,
};
