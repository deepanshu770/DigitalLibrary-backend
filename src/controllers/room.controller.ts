import { Request, Response } from "express";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/AsynsHandler";
import { AppError } from "../utils/AppError";

// Utility: validate ISO date string
const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const RoomController = {
  // ✅ Create a new meeting room
  createRoom: asyncHandler(async (req: Request, res: Response) => {
    const { name, capacity, location, amenities } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new AppError("Room name is required and must be at least 2 characters", 400);
    }
    if (!capacity || typeof capacity !== "number" || capacity <= 0) {
      throw new AppError("Capacity must be a positive number", 400);
    }
    if (!location || typeof location !== "string") {
      throw new AppError("Location is required", 400);
    }
    if (!Array.isArray(amenities)) {
      throw new AppError("Amenities must be an array of strings", 400);
    }

    const room = await prisma.meeting_rooms.create({
      data: { name: name.trim(), capacity, location, amenities },
    });

    res.status(201).json({ ok: true, room });
  }),

  // ✅ Get all meeting rooms
  getAllRooms: asyncHandler(async (_: Request, res: Response) => {
    const rooms = await prisma.meeting_rooms.findMany({
      include: { bookings: true },
    });

    res.json({ ok: true, count: rooms.length, rooms });
  }),

  // ✅ Get room by ID
  getRoomById: asyncHandler(async (req: Request, res: Response) => {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) throw new AppError("Invalid room id", 400);

    const room = await prisma.meeting_rooms.findUnique({
      where: { room_id: roomId },
      include: { bookings: true },
    });

    if (!room) throw new AppError("Room not found", 404);

    res.json({ ok: true, room });
  }),

  // ✅ Create a booking
  createBooking: asyncHandler(async (req: Request, res: Response) => {
    const { student_id, room_id, start_time, end_time } = req.body;

    if (!student_id || typeof student_id !== "string") {
      throw new AppError("Student ID is required", 400);
    }
    if (!room_id || isNaN(Number(room_id))) {
      throw new AppError("Valid room_id is required", 400);
    }
    if (!isValidDate(start_time) || !isValidDate(end_time)) {
      throw new AppError("Start and end time must be valid dates", 400);
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (end <= start) {
      throw new AppError("End time must be after start time", 400);
    }
    if (start < new Date()) {
      throw new AppError("Booking cannot be created in the past", 400);
    }

    // Ensure room exists
    const room = await prisma.meeting_rooms.findUnique({ where: { room_id: Number(room_id) } });
    if (!room) throw new AppError("Room not found", 404);

    // Ensure student exists
    const student = await prisma.students.findUnique({ where: { student_id } });
    if (!student) throw new AppError("Student not found", 404);

    // Check for conflicts
    const conflict = await prisma.bookings.findFirst({
      where: {
        room_id: Number(room_id),
        status: "CONFIRMED",
        start_time: { lt: end },
        end_time: { gt: start },
      },
    });
    if (conflict) throw new AppError("Room already booked for this time slot", 400);

    const booking = await prisma.bookings.create({
      data: { student_id, room_id: Number(room_id), start_time: start, end_time: end, status: "CONFIRMED" },
    });

    res.status(201).json({ ok: true, booking });
  }),

  // ✅ Cancel booking
  cancelBooking: asyncHandler(async (req: Request, res: Response) => {
    const bookingId = Number(req.params.id);
    if (isNaN(bookingId)) throw new AppError("Invalid booking id", 400);

    const booking = await prisma.bookings.findUnique({ where: { booking_id: bookingId } });
    if (!booking) throw new AppError("Booking not found", 404);

    if (booking.status === "CANCELLED") {
      throw new AppError("Booking is already cancelled", 400);
    }

    const cancelled = await prisma.bookings.update({
      where: { booking_id: bookingId },
      data: { status: "CANCELLED" },
    });

    res.json({ ok: true, booking: cancelled });
  }),

  // ✅ Get all bookings for a student
  getStudentBookings: asyncHandler(async (req: Request, res: Response) => {
    const { student_id } = req.params;
    if (!student_id) throw new AppError("Student ID is required", 400);

    const bookings = await prisma.bookings.findMany({
      where: { student_id },
      include: { room: true },
      orderBy: { start_time: "asc" },
    });

    res.json({ ok: true, count: bookings.length, bookings });
  }),

  // ✅ Filter rooms by amenities
  filterRoomsByAmenities: asyncHandler(async (req: Request, res: Response) => {
    const { amenities } = req.body;
    if (!Array.isArray(amenities) || amenities.length === 0) {
      throw new AppError("Amenities must be a non-empty array", 400);
    }

    const rooms = await prisma.meeting_rooms.findMany({
      where: { amenities: { array_contains: amenities } },
    });

    res.json({ ok: true, count: rooms.length, rooms });
  }),

  // ✅ Update room
  updateRoom: asyncHandler(async (req: Request, res: Response) => {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) throw new AppError("Invalid room id", 400);

    const { name, capacity, location, amenities } = req.body;

    const existingRoom = await prisma.meeting_rooms.findUnique({ where: { room_id: roomId } });
    if (!existingRoom) throw new AppError("Room not found", 404);

    const room = await prisma.meeting_rooms.update({
      where: { room_id: roomId },
      data: {
        ...(name && { name }),
        ...(capacity && capacity > 0 && { capacity }),
        ...(location && { location }),
        ...(Array.isArray(amenities) && { amenities }),
      },
    });

    res.json({ ok: true, room });
  }),

  // ✅ Delete room
  deleteRoom: asyncHandler(async (req: Request, res: Response) => {
    const roomId = Number(req.params.id);
    if (isNaN(roomId)) throw new AppError("Invalid room id", 400);

    const existingRoom = await prisma.meeting_rooms.findUnique({ where: { room_id: roomId } });
    if (!existingRoom) throw new AppError("Room not found", 404);

    await prisma.meeting_rooms.delete({ where: { room_id: roomId } });

    res.json({ ok: true, message: "Room deleted successfully" });
  }),

  // ✅ List all bookings
  getAllBookings: asyncHandler(async (_: Request, res: Response) => {
    const bookings = await prisma.bookings.findMany({
      include: { room: true, student: true },
      orderBy: { start_time: "desc" },
    });

    res.json({ ok: true, count: bookings.length, bookings });
  }),

  // ✅ Get available slots
  getAvailableSlots: asyncHandler(async (req: Request, res: Response) => {
    const { room_id, start_date, end_date, duration } = req.body;

    if (!room_id || isNaN(Number(room_id))) {
      throw new AppError("Valid room_id is required", 400);
    }
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      throw new AppError("Start and end date must be valid", 400);
    }
    if (!duration || typeof duration !== "number" || duration <= 0) {
      throw new AppError("Duration must be a positive number (minutes)", 400);
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400);
    }

    const room = await prisma.meeting_rooms.findUnique({ where: { room_id: Number(room_id) } });
    if (!room) throw new AppError("Room not found", 404);

    const bookings = await prisma.bookings.findMany({
      where: {
        room_id: Number(room_id),
        status: "CONFIRMED",
        OR: [
          { start_time: { gte: startDate, lt: endDate } },
          { end_time: { gt: startDate, lte: endDate } },
        ],
      },
      orderBy: { start_time: "asc" },
    });

    const slots: { start: Date; end: Date }[] = [];
    let current = new Date(startDate);

    for (const booking of bookings) {
      const bookingStart = new Date(booking.start_time);
      if (bookingStart.getTime() - current.getTime() >= duration * 60 * 1000) {
        slots.push({ start: new Date(current), end: new Date(bookingStart) });
      }
      const bookingEnd = new Date(booking.end_time);
      if (bookingEnd > current) current = bookingEnd;
    }

    if (endDate.getTime() - current.getTime() >= duration * 60 * 1000) {
      slots.push({ start: new Date(current), end: new Date(endDate) });
    }

    res.json({ ok: true, slots });
  }),
};

export default RoomController;
