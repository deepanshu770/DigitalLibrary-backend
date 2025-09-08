
import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("🔥 Error caught by middleware:", err);

  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 400;
        message = `Unique constraint failed on fields: ${err.meta?.target}`;
        break;
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;
      default:
        message = `Database error: ${err.message}`;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data passed to Prisma query";
  } else if ((err as any).name === "ZodError") {
    statusCode = 400;
    return res.status(statusCode).json({
      ok: false,
      errors: (err as any).errors,
    });
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    ok: false,
    message,
  });
}
