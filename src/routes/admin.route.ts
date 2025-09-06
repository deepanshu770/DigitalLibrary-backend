import express from "express";
import prisma from "../config/prisma";

export const admin = express.Router();

// ✅ Logs endpoint (with filters)
admin.get("/logs", async (req, res) => {
  try {
    const { student_id, from, to } = req.query as {
      student_id?: string;
      from?: string;
      to?: string;
    };

    const where: any = {};

    if (student_id) {
      where.student_id = student_id;
    }

    if (from && to) {
      where.entry_time = {
        gte: new Date(from),
        lte: new Date(to),
      };
    } else if (from) {
      where.entry_time = { gte: new Date(from) };
    } else if (to) {
      where.entry_time = { lte: new Date(to) };
    }

    const logs = await prisma.sessions.findMany({
      where,
      include: {
        students: { select: { name: true } },
      },
      orderBy: { entry_time: "desc" },
      take: 500,
    });

    // Compute duration in seconds
    const formatted = logs.map((s: any) => ({
      id: s.id,
      student_id: s.student_id,
      student_name: s.students.name,
      entry_time: s.entry_time,
      exit_time: s.exit_time,
      duration_sec: Math.floor(
        ((s.exit_time ?? new Date()).getTime() - s.entry_time.getTime()) / 1000
      ),
    }));

    res.json({ ok: true, rows: formatted });
  } catch (e: any) {
    console.error(e);
    res.json({ ok: false, error: e.message });
  }
});

// ✅ Who is inside now
admin.get("/inside", async (req, res) => {
  try {
    const rows = await prisma.sessions.findMany({
      where: { status: "IN", exit_time: null },
      include: {
        students: { select: { name: true, course: true } },
      },
      orderBy: { entry_time: "desc" },
    });
    console.log(rows)
        const formatted = rows.map((s: any) => ({
      student_id: s.student_id,
      student_name: s.students.name,
      course: s.students.course,
      entry_time: s.entry_time,
    }));

    res.json({ ok: true, rows: formatted });
  } catch (e: any) {
    console.error(e);
    res.json({ ok: false, error: e.message });
  }
});

// ✅ List all students
admin.get("/students", async (req, res) => {
  try {
    const rows = await prisma.students.findMany({
      select: {
        student_id: true,
        name: true,
        course: true,
        department: true,
      },
    });

    res.json({ ok: true, rows });
  } catch (e: any) {
    console.error(e);
    res.json({ ok: false, error: e.message });
  }
});
