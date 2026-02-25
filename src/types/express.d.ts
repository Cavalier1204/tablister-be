import { Request } from "express";
import { Session, User } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    accessToken?: string;
    session?: Session;
    user?: User;
  }
}
