import type { Request, Response } from "express"
import { issueService } from "./issues.service"

const createIssue = async (req: Request, res: Response) =>{
    console.log('controller',req.user);
    const result = await issueService.createIssueIntoDB(req.body)
}

export const issueController = {
    createIssue
}