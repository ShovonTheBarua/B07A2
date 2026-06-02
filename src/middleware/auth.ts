import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utility/sendResponse";
import config from "../config";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //! token validation that we get from headers authorization
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Invalid token",
        });
      }

      //! decode the token 
      const decoded = jwt.verify(token as string, config.secret) as JwtPayload;

      //! verifying wether the user exists
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id],
      );
       if (userData.rows.length === 0) {
        return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "user not found",
        });
      }

      //! set data inside request
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
export default auth;
