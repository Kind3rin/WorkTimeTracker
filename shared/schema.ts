import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  date: date("date").notNull(),
  hours: real("hours").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  userId: true,
  projectId: true,
  date: true,
  hours: true,
  description: true,
  status: true,
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  receiptPath: text("receipt_path"),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  userId: true,
  category: true,
  amount: true,
  date: true,
  description: true,
  status: true,
  receiptPath: true,
});

// Travel/Business trips table
export const travels = pgTable("travels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  destination: text("destination").notNull(),
  purpose: text("purpose").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertTravelSchema = createInsertSchema(travels).pick({
  userId: true,
  destination: true,
  purpose: true,
  startDate: true,
  endDate: true,
  status: true,
});

// Leave requests (vacation, sick leave, time off)
export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // vacation, sick, time_off
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
});

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  userId: true,
  type: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("planning"),
  progress: integer("progress").notNull().default(0),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  status: true,
  progress: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Travel = typeof travels.$inferSelect;
export type InsertTravel = z.infer<typeof insertTravelSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
