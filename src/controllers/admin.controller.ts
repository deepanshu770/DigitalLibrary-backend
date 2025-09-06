
// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "../constants/constants.js";
// import { getPool } from "../config/db.js";

// export const adminLogin = async (req, res) => {
//   const { username, password } = req.body || {};
//   const row =await getPool().query(
//     "SELECT * FROM admins WHERE username=? AND password=?",
//     [username, password]
//   );
//   if (!row)
//     return res.status(401).json({ ok: false, error: "Invalid credentials" });
//   const token = jwt.sign({ role: "admin", sub: username }, JWT_SECRET, {
//     expiresIn: "8h",
//   });
//   res.json({ ok: true, token });
// };
