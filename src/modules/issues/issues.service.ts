import { pool } from "../../db";
import type { IIssue, IIssueQuery } from "./issues.interface";

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

  if (type && status) {
    const result = await pool.query(
      `
      SELECT * FROM issues  WHERE type=$1 AND status = $2
      ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
      `,
      [type, status],
    );
    // const issues = result.rows;
    // const allId = issues.map((issue) => issue.reporter_id);
    // const reId = new Set(allId)
    // console.log(reId);
    return result.rows;
  }

  if (type) {
    const result = await pool.query(
      `
      SELECT * FROM issues  WHERE type = $1
      ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
      `,
      [type],
    );
    return result.rows;
  } else if (status) {
    const result = await pool.query(
      `
      SELECT * FROM issues  WHERE status = $1
      ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
      `,
      [status],
    );
    return result.rows;
  } else {
    const result = await pool.query(
      `
      SELECT * FROM issues
      ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
      `,
    );
    return result.rows;
  }
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
