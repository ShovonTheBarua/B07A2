import express, { type Application, type Request, type Response } from "express";
import { useRoute } from "./modules/users/user.route";

const app: Application = express();

app.use(express.json())
 

app.use("/api/auth", useRoute) 

export default app;
