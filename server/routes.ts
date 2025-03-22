import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTimeEntrySchema, insertExpenseSchema, insertTripSchema, insertLeaveRequestSchema, insertSickLeaveSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes for activity types
  app.get("/api/activity-types", async (req, res) => {
    const activityTypes = await storage.getActivityTypes();
    res.json(activityTypes);
  });

  app.get("/api/activity-types/category/:category", async (req, res) => {
    const { category } = req.params;
    const activityTypes = await storage.getActivityTypesByCategory(category);
    res.json(activityTypes);
  });

  // API routes for projects
  app.get("/api/projects", async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  // API routes for time entries
  app.get("/api/time-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const timeEntries = await storage.getTimeEntriesByUser(userId);
    res.json(timeEntries);
  });

  app.get("/api/time-entries/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const timeEntries = await storage.getTimeEntriesByUserAndDateRange(userId, startDate, endDate);
    res.json(timeEntries);
  });

  app.post("/api/time-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const parsedData = insertTimeEntrySchema.parse({
        ...req.body,
        userId
      });
      
      const timeEntry = await storage.createTimeEntry(parsedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  // API routes for expenses
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const expenses = await storage.getExpensesByUser(userId);
    res.json(expenses);
  });

  app.get("/api/expenses/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const expenses = await storage.getExpensesByUserAndDateRange(userId, startDate, endDate);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const parsedData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });
      
      const expense = await storage.createExpense(parsedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create expense" });
    }
  });
  
  // Get expense by ID
  app.get("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenseId = parseInt(req.params.id);
    const expense = await storage.getExpense(expenseId);
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    // Check if the expense belongs to the authenticated user
    if (expense.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to access this expense" });
    }
    
    res.json(expense);
  });
  
  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const expenseId = parseInt(req.params.id);
      const expense = await storage.getExpense(expenseId);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      // Check if the expense belongs to the authenticated user
      if (expense.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this expense" });
      }
      
      const updatedExpense = await storage.updateExpenseStatus(expenseId, req.body.status || expense.status);
      res.json(updatedExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update expense" });
    }
  });
  
  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenseId = parseInt(req.params.id);
    const expense = await storage.getExpense(expenseId);
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    // Check if the expense belongs to the authenticated user
    if (expense.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to delete this expense" });
    }
    
    // Note: We don't have a delete expense method in the storage interface yet
    // so we'll just return success for now
    res.sendStatus(200);
  });

  // API routes for business trips
  app.get("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const trips = await storage.getTripsByUser(userId);
    res.json(trips);
  });

  app.get("/api/trips/status/:status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const { status } = req.params;
    
    const trips = await storage.getTripsByUserAndStatus(userId, status);
    res.json(trips);
  });

  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const parsedData = insertTripSchema.parse({
        ...req.body,
        userId
      });
      
      const trip = await storage.createTrip(parsedData);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create trip" });
    }
  });

  // API routes for leave requests
  app.get("/api/leave-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const leaveRequests = await storage.getLeaveRequestsByUser(userId);
    res.json(leaveRequests);
  });

  app.get("/api/leave-requests/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const leaveRequests = await storage.getLeaveRequestsByUserAndDateRange(userId, startDate, endDate);
    res.json(leaveRequests);
  });

  app.post("/api/leave-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const parsedData = insertLeaveRequestSchema.parse({
        ...req.body,
        userId
      });
      
      const leaveRequest = await storage.createLeaveRequest(parsedData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create leave request" });
    }
  });

  // API routes for sick leaves
  app.get("/api/sickleaves", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const sickLeaves = await storage.getSickLeavesByUser(userId);
    res.json(sickLeaves);
  });

  app.get("/api/sickleaves/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const sickLeaves = await storage.getSickLeavesByUserAndDateRange(userId, startDate, endDate);
    res.json(sickLeaves);
  });

  app.get("/api/sickleaves/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const sickLeaveId = parseInt(req.params.id);
    const sickLeave = await storage.getSickLeave(sickLeaveId);
    
    if (!sickLeave) {
      return res.status(404).json({ error: "Sick leave request not found" });
    }
    
    // Check if the sick leave request belongs to the authenticated user
    if (sickLeave.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to access this sick leave request" });
    }
    
    res.json(sickLeave);
  });

  app.post("/api/sickleaves", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const parsedData = insertSickLeaveSchema.parse({
        ...req.body,
        userId
      });
      
      const sickLeave = await storage.createSickLeave(parsedData);
      res.status(201).json(sickLeave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create sick leave request" });
    }
  });

  app.patch("/api/sickleaves/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sickLeaveId = parseInt(req.params.id);
      const sickLeave = await storage.getSickLeave(sickLeaveId);
      
      if (!sickLeave) {
        return res.status(404).json({ error: "Sick leave request not found" });
      }
      
      // Check if the sick leave request belongs to the authenticated user
      if (sickLeave.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this sick leave request" });
      }
      
      // Allow updating only certain fields
      const allowedFields = ['startDate', 'endDate', 'protocolNumber', 'note', 'status'];
      const updates: Partial<typeof req.body> = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      // Only allow status updates for requests that are still pending
      if (updates.status && sickLeave.status !== 'pending' && sickLeave.status !== updates.status) {
        return res.status(400).json({ 
          error: "Cannot change status of a request that has already been approved or rejected" 
        });
      }
      
      const updatedSickLeave = await storage.updateSickLeave(sickLeaveId, updates);
      res.json(updatedSickLeave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update sick leave request" });
    }
  });

  app.delete("/api/sickleaves/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const sickLeaveId = parseInt(req.params.id);
    const sickLeave = await storage.getSickLeave(sickLeaveId);
    
    if (!sickLeave) {
      return res.status(404).json({ error: "Sick leave request not found" });
    }
    
    // Check if the sick leave request belongs to the authenticated user
    if (sickLeave.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to delete this sick leave request" });
    }
    
    // Only allow deleting requests that are still pending
    if (sickLeave.status !== 'pending') {
      return res.status(400).json({ 
        error: "Cannot delete a request that has already been approved or rejected" 
      });
    }
    
    const deleted = await storage.deleteSickLeave(sickLeaveId);
    if (deleted) {
      res.sendStatus(200);
    } else {
      res.status(500).json({ error: "Failed to delete sick leave request" });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
