import { Router } from "express";
import { issueController } from "./issues.controlle";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), issueController.createIssue);

export const issueRoute = router;
