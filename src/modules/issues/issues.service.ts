import { pool } from "../../db";

const createIssueIntoDB = async (payload: any) => {


    
//   const issue = await pool.query(`
//         INSERT INTO issues(title, description, type) VALUES($1, $2, $3)
//         `);
};

export const issueService = {
  createIssueIntoDB,
};
