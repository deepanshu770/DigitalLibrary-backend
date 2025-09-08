import express from "express";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/AsynsHandler";
import EntryController from "../controllers/entry.controller";
import { students } from "@prisma/client";

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
admin.post(
  "/test/create/students",
  asyncHandler(async (req, res) => {

    const row = await prisma.students.create({
      data:{...req.body as students}
    })
   
    res.json({ ok: true,row  });
  })
);
