import { Router } from "express";
import { issueController } from "./issues.controlle";
import auth from "../../middleware/auth";
import { issueService } from "./issues.service";

const router = Router();

router.post("/", auth(), issueController.createIssue);
router.get("/", issueController.getAllIssue);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth(), issueController.updateSingleIssue);
router.delete("/:id", auth(), issueController.deleteSingleIssue);

export const issueRoute = router;
