import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utility/sendResponse";
import config from "../config";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Invalid token",
        });
      }

      const decoded = jwt.verify(token as string, config.secret) as JwtPayload;

      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id],
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "user not found",
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
export default auth;
