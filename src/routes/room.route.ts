import express from "express";
import RoomController from "../controllers/room.controller";
import { adminAuth } from "../middlewares/adminAuth";
import { studentAuth } from "../middlewares/studentAuth";

const room = express.Router();

// Room routes
room.get("/rooms", studentAuth, RoomController.getAllRooms);
room.get("/rooms/:id", studentAuth, RoomController.getRoomById);

// Get available slots
room.post(
  "/rooms/available-slots",
  studentAuth,
  RoomController.getAvailableSlots
);

// Booking routes
room.post("/bookings", studentAuth, RoomController.createBooking);
room.put("/bookings/:id/cancel", studentAuth, RoomController.cancelBooking);
room.get(
  "/bookings/student/:student_id",
  studentAuth,
  RoomController.getStudentBookings
);

// Filter rooms
room.post("/rooms/filter", studentAuth, RoomController.filterRoomsByAmenities);

// Admin-only room management
room.post("/rooms", adminAuth, RoomController.createRoom);
room.put("/rooms/:id", adminAuth, RoomController.updateRoom);
room.delete("/rooms/:id", adminAuth, RoomController.deleteRoom);
// Admin-only booking monitoring
room.get("/bookings", adminAuth, RoomController.getAllBookings);

export default room;
