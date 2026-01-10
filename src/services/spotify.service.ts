import axios from "axios";
import { env } from "@/config/env.js";

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
            env.SPOTIFY.CLIENT_ID + ":" + env.SPOTIFY.CLIENT_SECRET
          ).toString("base64"),
      },
    }
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
            env.SPOTIFY.CLIENT_ID + ":" + env.SPOTIFY.CLIENT_SECRET
          ).toString("base64"),
      },
    }
  );

  return response.data; // new access_token, expires_in
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
  getProfile,
  getUserPlaylists,
};
