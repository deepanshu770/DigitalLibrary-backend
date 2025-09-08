import express from "express";
import prisma from "../config/prisma";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants/constants";
import { asyncHandler } from "../utils/AsynsHandler";
import { AppError } from "../utils/AppError";

export const student = express.Router();

// ✅ Active students count
student.get(
  "/active-students",
  asyncHandler(async (_, res) => {
    const activeStudents = await prisma.sessions.count({
      where: { status: "IN" },
    });
    res.json({
      ok: true,
      activeStudents,
    });
  })
);

// ✅ Student login
student.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { student_id, password } = req.body || {};

    if (!student_id || !password) {
      throw new AppError("Missing Credentials", 400);
    }

    // ⚠️ In production: compare with bcrypt, not plain text
    const student = await prisma.students.findUnique({
      where: { student_id },
    });

    if (!student || student.password !== password) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign(
      {
        student_name: student.name,
        student_id: student.student_id,
        course: student.course,
      },
      JWT_SECRET
    );

    res.json({
      ok: true,
      token,
      student_name: student.name,
    });
  })
);
