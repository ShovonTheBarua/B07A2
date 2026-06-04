import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { useRoute } from "./modules/users/user.route";
import { issueRoute } from "./modules/issues/issues.route";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();


app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5000",
    }),
);

app.get("/", (req: Request, res: Response) => {
  //   res.send('Hello World!')
  res.status(200).json({ message: "Express Server", author: "Next Level" });
});
app.use("/api/auth", useRoute);
app.use("/api/issues", issueRoute);

app.use(globalErrorHandler);

export default app;
