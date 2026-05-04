import { Request, Response } from "express";

const me = (req: Request, res: Response) => {
  return res.json(req.user);
};

export default { me };
