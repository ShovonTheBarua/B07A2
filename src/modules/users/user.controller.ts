import type { Request, Response } from "express";
import { userService } from "./user.service";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserIntoDB(req.body);

    res.status(201).json({
      success: true,
      message: "user created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: error.message, error: error });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUserIntoDB(email, password);
  } catch (error) {
    console.log(error);
  }
};

export const userController = {
  createUser,
  loginUser,
};
