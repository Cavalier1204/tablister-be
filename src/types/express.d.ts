import { Request } from "express";
import { Session } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    accessToken?: string;
    session?: Session;
  }
}
