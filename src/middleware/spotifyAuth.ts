import { Request, Response, NextFunction } from "express";
import prisma from "@/db/prisma.js";
import spotifyService from "@/services/spotify.service.js";

export async function spotifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ error: "Not logged in" });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return res.status(401).json({ error: "Invalid session" });

  let accessToken = session.accessToken;
  const now = new Date();

  if (!accessToken || !session.expiresAt || session.expiresAt < now) {
    try {
      const refreshed = await spotifyService.refreshAccessToken(
        session.refreshToken
      );
      accessToken = refreshed.access_token;
      await prisma.session.update({
        where: { id: session.id },
        data: {
          accessToken,
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    } catch (err) {
      return res.status(401).json({ error: "Failed to refresh token" });
    }
  }

  (req as any).accessToken = accessToken;
  (req as any).session = session;
  next();
}
