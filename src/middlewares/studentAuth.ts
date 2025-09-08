import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // keep in .env

export const studentAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      student_id: string;
      role: string;
      student_name: string;
      course: string;
    };

    if (decoded.role !== "student") {
      return res
        .status(403)
        .json({ ok: false, error: "Forbidden: Unautorized" });
    }

    (req as any).student = decoded; // attach admin info to request
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ ok: false, error: "Invalid or expired token" });
  }
};
