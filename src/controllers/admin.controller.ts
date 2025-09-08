import { sign } from "jsonwebtoken";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/AsynsHandler";
import { JWT_SECRET } from "../constants/constants";

 const AdminController = {
  adminLogin: asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const row = await prisma.admins.findUnique({
      where: { username, password },
    });
    if (!row) {
      throw new AppError("Invalid credentials", 401);
    }
    const token = sign({ role: "admin", sub: username }, JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ ok: true, token });
  }),
};

export default AdminController;
