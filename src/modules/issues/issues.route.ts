import { Router } from "express";
import { issueController } from "./issues.controlle";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), issueController.createIssue);
router.get('/', issueController.getAllIssue)
router.get('/:id', )

export const issueRoute = router;
