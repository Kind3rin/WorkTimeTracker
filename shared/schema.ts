import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("employee"),
  needsPasswordChange: boolean("needs_password_change").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  needsPasswordChange: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  client: text("client"),
  status: text("status").notNull().default("active"),
});

export const insertProjectSchema = createInsertSchema(projects);

// Activity types
export const activityTypes = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // work, time_off, trip
  description: text("description"),
});

export const insertActivityTypeSchema = createInsertSchema(activityTypes);

// Time entries
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  projectId: integer("project_id").notNull(),
  activityTypeId: integer("activity_type_id").notNull(),
  description: text("description"),
  hours: numeric("hours").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  userId: true,
  date: true,
  projectId: true,
  activityTypeId: true,
  description: true,
  hours: true,
  status: true,
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(), // travel, meal, accommodation, other
  description: text("description"),
  tripId: integer("trip_id"),
  receiptPath: text("receipt_path"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  userId: true,
  date: true,
  amount: true,
  category: true,
  description: true,
  tripId: true,
  receiptPath: true,
  status: true,
});

// Business trips
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  purpose: text("purpose"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(trips).pick({
  userId: true,
  destination: true,
  startDate: true,
  endDate: true,
  purpose: true,
  status: true,
});

// Leave requests (vacation, personal leave, etc.)
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  type: text("type").notNull(), // vacation, personal_leave
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).pick({
  userId: true,
  startDate: true,
  endDate: true,
  type: true,
  reason: true,
  status: true,
});

// Sick leave requests (with protocol number for Italian compliance)
export const sickLeaves = pgTable("sick_leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  protocolNumber: text("protocol_number").notNull(),
  note: text("note"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSickLeaveSchema = createInsertSchema(sickLeaves).pick({
  userId: true,
  startDate: true,
  endDate: true,
  protocolNumber: true,
  note: true,
  status: true,
});

// Define types for all schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ActivityType = typeof activityTypes.$inferSelect;
export type InsertActivityType = z.infer<typeof insertActivityTypeSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type SickLeave = typeof sickLeaves.$inferSelect;
export type InsertSickLeave = z.infer<typeof insertSickLeaveSchema>;
