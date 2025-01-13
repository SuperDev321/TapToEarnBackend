import { Request, Response, NextFunction } from "express";
import { getUserByAccessToken } from "../service/user";

export const userMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.headers["x-api-key"];

    if (!accessToken) {
      next(new Error("missing x-api-key header"));
    } else {
      const user = await getUserByAccessToken(accessToken);

      if (!user) {
        next(new Error("invalid x-api-key header"));
      } else {
        (req as any).user = user;
        next();
      }
    }
  } catch (error) {
    next(error);
  }
};
