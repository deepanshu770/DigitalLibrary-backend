import express from "express";
import prisma from "../config/prisma";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants/constants";

export const student = express.Router();

// ✅ Active students count
student.get("/active-students", async (_, res) => {
  try {
    const activeStudents = await prisma.sessions.count({
      where: { status: "IN" },
    });

    res.json({
      ok: true,
      activeStudents,
    });
  } catch (error: any) {
    res.json({
      ok: false,
      error: error?.message,
    });
  }
});

// ✅ Student login
student.post("/login", async (req, res) => {
  try {
    const { student_id, password } = req.body || {};

    if (!student_id || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing credentials" });
    }

    // ⚠️ In production: compare with bcrypt, not plain text
    const student = await prisma.students.findUnique({
      where: { student_id },
    });

    if (!student || student.password !== password) {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid credentials" });
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
  } catch (error: any) {
    res.json({
      ok: false,
      error: error?.message,
    });
  }
});
