import { pool } from "../../db";
import type {
  IIssue,
  IIssueQuery,
  IReporter,
  IUpdateIssue,
} from "./issues.interface";

const createIssueIntoDB = async (payload: IIssue, userId: number) => {
  const { title, description, type, status } = payload;

  const issue = await pool.query(
    `
        INSERT INTO issues(title, description, type, status, reporter_id) VALUES($1, $2, $3, COALESCE($4, 'open'), $5)
        RETURNING *
        `,
    [title, description, type, status, userId],
  );

  return issue;
};

const getAllIssuesFromDB = async (query: IIssueQuery) => {
  const { type, status, sort = "newest" } = query;

  const conditions: string[] = [];
  const values: string[] = [];

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

  // sorting
  sql = sql + ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;

  const result = await pool.query(sql, values);

  // got all reporter id's
  const issues = result.rows;
  const userIdDup = issues.map((issue) => issue.reporter_id);
  const userId = new Set(userIdDup);
  const userIdArr: number[] = [...userId];

  // fetch all reporter in query
  const reporter = await pool.query(`
    SELECT * FROM  users WHERE id IN (${userIdArr})
    `);

  const repoLookup = reporter.rows.reduce((acc, reporter) => {
    acc[reporter.id] = reporter;
    return acc;
  }, {});

  const formattedIssues = issues.map((issue) => {
    const reporter = repoLookup[issue.reporter_id];
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: reporter.id,
        name: reporter.name,
        role: reporter.role,
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });

  console.log(repoLookup[1]);

  //  console.log(repoLookup);
  // console.log(reporter.rows);

  return formattedIssues;
};

const getSingleIssueFromDB = async (id: number) => {
  const result = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1
      `,
    [id],
  );
  console.log(result.rows);
  const issue = result.rows[0];
  const reporter_id = issue.reporter_id;

  //! fetch issues
  const reporterData = await pool.query(
    `
    SELECT * FROM users WHERE id=$1
    `,
    [reporter_id],
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
      role: reporter.role,
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return formattedResult;
};

const updateSingleIssueInDB = async (payload: IUpdateIssue) => {
  const { userId, issueId, userRole, title, description, type } = payload;

  const issueData = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [issueId],
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
    type=COALESCE($3, type)
    WHERE id=$4
    RETURNING *
    `,
    [title, description, type, issueId],
  );

  if (userRole === "maintainer") {
    return update;
  } else if (issue.reporter_id === userId && issue.status === "open") {
    return update;
  } else {
    throw new Error("unauthorized access");
  }

};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateSingleIssueInDB,
};
