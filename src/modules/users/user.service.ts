import bcrypt from "bcryptjs";
import { pool } from "../../db";

const createUserIntoDB = async (payload: any) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 10 );

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role) VALUES($1,$2,$3, COALESCE($4, 'contributor'))
    RETURNING *
    `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;

  return result;
};

const loginUserIntoDB = async(email: string, password:string)=>{
  const result = await pool.query(`
    SELECT * FROM users WHERE email=$1
    `,[email])

    console.log(result.rows[0]);
}

export const userService = {
  createUserIntoDB,
  loginUserIntoDB
};
