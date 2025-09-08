import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { admin } from "./routes/admin.route";
import { student } from "./routes/student.route";
import { CronJob } from "cron";
import { PORT, JWT_SECRET } from "./constants/constants";
import prisma from "./config/prisma";
import { errorHandler } from "./middlewares/errorHandler";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));



// --- Routes ---
app.use("/api/admin", admin);
app.use("/api/student", student);

interface ScannedPayload {
  student_id: string;
  student_name: string;
  course: string;
}

// Scan endpoint — called by gate scanner
app.post("/api/scan", async (req, res) => {
  try {
    if (!req.body.token) {
      return res.status(400).json({ ok: false, error: "Missing Data" });
    }

    const decoded = jwt.verify(req.body.token, JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("student_id" in decoded)
    ) {
      throw new Error("Invalid QR Code");
    }

    const { student_id, student_name, course } = decoded as ScannedPayload;
    const timestamp = new Date();

    // Find last session
    const lastSession = await prisma.sessions.findFirst({
      where: { student_id },
      orderBy: { id: "desc" },
    });

    let action;
    if (lastSession && lastSession.status === "IN" && !lastSession.exit_time) {
      // Exit
      await prisma.sessions.update({
        where: { id: lastSession.id },
        data: { exit_time: timestamp, status: "OUT" },
      });
      action = "Exit";
    } else {
      // Entry
      await prisma.sessions.create({
        data: {
          student_id,
          entry_time: timestamp,
          status: "IN",
        },
      });
      action = "Entry";
    }

    res.json({
      action,
      student_name,
      student_id,
      course,
      timestamp,
    });
  } catch (e: any) {
    res.json({ error: e?.message });
  }
});

// Auto close sessions at 10 PM daily
const job = new CronJob("0 22 * * *", async () => {
  try {
    const date = new Date();
    await prisma.sessions.updateMany({
      where: { status: "IN" },
      data: { exit_time: date, status: "OUT" },
    });
    console.log("✅ Exited all remaining students");
  } catch (e) {
    console.error(e);
  }
});
job.start();

// Error Handling Middleware
app.use(errorHandler);


app.use("/", (_, res) => {
  res.json({ connected: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});