

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/users/user.route.ts
import { Router } from "express";

// src/modules/users/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(30) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
    await pool.query(`
        
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,

        title VARCHAR(150) NOT NULL,

        description TEXT NOT NULL
        CHECK (LENGTH(description) >=20),

        type VARCHAR(20) NOT NULL
        CHECK (type IN ('bug', 'feature_request')),

        status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),

        reporter_id INT NOT NULL,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()

        )`);
  } catch (error) {
    console.log(error);
  }
};

// src/modules/users/user.service.ts
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users  (name, email, password, role) VALUES($1,$2,$3, COALESCE($4, 'contributor'))
    RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (email, password) => {
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    throw new Error("Invalid Credentials");
  }
  delete user.password;
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const accessToken = jwt.sign(payload, config_default.secret, { expiresIn: "1d" });
  return { accessToken, user };
};
var userService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/users/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "user created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUserIntoDB(email, password);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  loginUser
};

// src/modules/users/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
router.post("/login", userController.loginUser);
var useRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, userId) => {
  const { title, description, type, status } = payload;
  const issue = await pool.query(
    `
        INSERT INTO issues(title, description, type, status, reporter_id) VALUES($1, $2, $3, COALESCE($4, 'open'), $5)
        RETURNING *
        `,
    [title, description, type, status, userId]
  );
  return issue;
};
var getAllIssuesFromDB = async (query) => {
  const { type, status, sort = "newest" } = query;
  const conditions = [];
  const values = [];
  if (type) {
    conditions.push(`type = $${values.length + 1}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status=$${values.length + 1}`);
    values.push(status);
  }
  let sql = `SELECT * FROM issues`;
  if (conditions.length > 0) {
    sql = sql + ` WHERE ${conditions.join(" AND ")}`;
  }
  sql = sql + ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;
  const result = await pool.query(sql, values);
  const issues = result.rows;
  const userIdDup = issues.map((issue) => issue.reporter_id);
  const userId = new Set(userIdDup);
  const userIdArr = [...userId];
  const reporter = await pool.query(`
    SELECT * FROM  users WHERE id IN (${userIdArr})
    `);
  const repoLookup = reporter.rows.reduce((acc, reporter2) => {
    acc[reporter2.id] = reporter2;
    return acc;
  }, {});
  const formattedIssues = issues.map((issue) => {
    const reporter2 = repoLookup[issue.reporter_id];
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: reporter2.id,
        name: reporter2.name,
        role: reporter2.role
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  console.log(repoLookup[1]);
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1
      `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("issue does not exists");
  }
  console.log(result.rows);
  const issue = result.rows[0];
  const reporter_id = issue.reporter_id;
  const reporterData = await pool.query(
    `
    SELECT * FROM users WHERE id=$1
    `,
    [reporter_id]
  );
  const reporter = reporterData.rows[0];
  const formattedResult = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: reporter.id,
      name: reporter.name,
      role: reporter.role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return formattedResult;
};
var updateSingleIssueInDB = async (payload) => {
  const { userId, issueId, userRole, title, description, type } = payload;
  const issueData = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [issueId]
  );
  const issue = issueData.rows[0];
  if (issueData.rows.length === 0) {
    throw new Error("issue not found");
  }
  const update = await pool.query(
    `
    UPDATE issues 
    SET 
    title=COALESCE($1, title), 
    description=COALESCE($2, description), 
    type=COALESCE($3, type),
    updated_at= NOW()
    WHERE id=$4
    RETURNING *
    `,
    [title, description, type, issueId]
  );
  if (userRole === "maintainer") {
    return update;
  } else if (issue.reporter_id === userId && issue.status === "open") {
    return update;
  } else {
    throw new Error("unauthorized access");
  }
};
var deleteSingleIssueInDB = async (issueId, userRole) => {
  const issue = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [issueId]
  );
  if (issue.rows.length === 0) {
    throw new Error("issues does not exist");
  }
  if (userRole === "maintainer") {
    const result = await pool.query(
      `
      DELETE FROM issues
      WHERE id= $1
    `,
      [issueId]
    );
    return result;
  } else {
    throw new Error("unauthorized access");
  }
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateSingleIssueInDB,
  deleteSingleIssueInDB
};

// src/modules/issues/issues.controlle.ts
var createIssue = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await issueService.createIssueIntoDB(req.body, userId);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "issues created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssue = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(
      req.query
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await issueService.getSingleIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateSingleIssue = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const payload = {
      userId,
      issueId,
      userRole,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type
    };
    const result = await issueService.updateSingleIssueInDB(payload);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteSingleIssue = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const userRole = req.user?.role;
    const result = await issueService.deleteSingleIssueInDB(issueId, userRole);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssue,
  getSingleIssue,
  updateSingleIssue,
  deleteSingleIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = () => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Invalid token"
        });
      }
      const decoded = jwt2.verify(token, config_default.secret);
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: 404,
          success: false,
          message: "user not found"
        });
      }
      req.user = decoded;
      console.log(decoded);
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(), issueController.createIssue);
router2.get("/", issueController.getAllIssue);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(), issueController.updateSingleIssue);
router2.delete("/:id", auth_default(), issueController.deleteSingleIssue);
var issueRoute = router2;

// src/app.ts
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "internal server error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({ message: "Express Server", author: "Next Level" });
});
app.use("/api/auth", useRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//! checking if user exists
//! compare the password
//! generate token
//! fetch issues
//! token validation that we get from headers authorization
//! decode the token 
//! verifying wether the user exists
//! set data inside request
//# sourceMappingURL=server.js.map