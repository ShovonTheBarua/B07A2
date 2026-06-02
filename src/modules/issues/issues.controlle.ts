import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import sendResponse from "../../utility/sendResponse";
import type { IIssueQuery } from "./issues.interface";

const createIssue = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await issueService.createIssueIntoDB(req.body, userId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "issues created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query as IIssueQuery);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssue,
};
