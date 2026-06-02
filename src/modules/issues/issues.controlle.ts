import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import sendResponse from "../../utility/sendResponse";
import type { IIssueQuery, IUpdateIssue } from "./issues.interface";

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
    const result = await issueService.getAllIssuesFromDB(
      req.query as IIssueQuery,
    );
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

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await issueService.getSingleIssueFromDB(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
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

const updateSingleIssue = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    // console.log(userId, userRole);

    const payload = {
      userId: userId,
      issueId: issueId,
      userRole: userRole,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
    };

    const result = await issueService.updateSingleIssueInDB(payload);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result?.rows[0],
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
  getSingleIssue,
  updateSingleIssue,
};
