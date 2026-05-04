import { Request, Response, NextFunction } from "express";
import spotifyService from "@/services/spotify.service.js";
import sessionService from "@/services/session.service.js";

// assumes req.session
export const spotifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sessionId = req.session?.id;
  if (!sessionId) return res.status(401).json({ error: "Not logged in" });

  try {
    const accessToken = await spotifyService.getValidAccessToken(sessionId);
    req.accessToken = accessToken;
    next();
  } catch (error) {
    res.clearCookie("sessionId");
    return res
      .status(401)
      .json({ error: "Unauthorized: Session invalid or expired" });
  }
};

export async function requireAuth( // resolves req.user and req.session
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).end();

  const session = await sessionService.findSession(sessionId);

  if (!session || session.revokedAt) {
    return res.status(401).end();
  }

  req.user = session.user;
  req.session = session;
  next();
}
