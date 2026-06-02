import { Router } from "express";
import { issueController } from "./issues.controlle";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), issueController.createIssue);
router.get("/", issueController.getAllIssue);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth(), issueController.updateSingleIssue);

export const issueRoute = router;
