import express from "express";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/AsynsHandler";
import EntryController from "../controllers/entry.controller";

export const admin = express.Router();

// ✅ Logs endpoint (with filters)
admin.get("/logs", EntryController.getLogs);

// ✅ Who is inside now
admin.get("/inside", EntryController.getInside);

// ✅ List all students
admin.get(
  "/students",
  asyncHandler(async (_, res) => {
    const rows = await prisma.students.findMany({
      select: {
        student_id: true,
        name: true,
        course: true,
        department: true,
      },
    });
    res.json({ ok: true, rows });
  })
);
