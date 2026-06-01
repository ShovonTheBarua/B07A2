import express, { type Application, type Request, type Response } from "express";
import { useRoute } from "./modules/users/user.route";
import { issueRoute } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json())
 

app.use("/api/auth", useRoute) 
app.use("/api/issues", issueRoute)


export default app;
