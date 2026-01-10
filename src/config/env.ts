import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? "3000"),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  API_URL: required("API_URL"),
  FRONTEND_URL: required("FRONTEND_URL"),
  DATABASE_URL: required("DATABASE_URL"),

  SPOTIFY: {
    CLIENT_ID: required("SPOTIFY_CLIENT_ID"),
    CLIENT_SECRET: required("SPOTIFY_CLIENT_SECRET"),
    REDIRECT_URI: required("SPOTIFY_REDIRECT_URI"),
  },
};
