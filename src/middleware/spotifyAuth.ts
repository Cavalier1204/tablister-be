import { Request, Response, NextFunction } from "express";
import spotifyService from "@/services/spotify.service.js";

export const spotifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionId = req.cookies.sessionId;
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
