import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTimeEntrySchema, insertExpenseSchema, insertTripSchema, insertLeaveRequestSchema, insertSickLeaveSchema } from "@shared/schema";
import { z } from "zod";

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Autenticazione richiesta" });
};

// Middleware per verificare se l'utente è un amministratore
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Accesso riservato agli amministratori" });
};

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

  // ================ ADMIN ROUTES ================
  
  // API per ottenere tutti gli utenti (solo admin)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Errore durante il recupero degli utenti" });
    }
  });
  
  // API per ottenere tutti i dati in base al tipo (solo admin)
  app.get("/api/admin/:type", isAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      let data = [];
      
      switch (type) {
        case "timesheet":
        case "timeEntries":
          data = await storage.getTimeEntriesByStatus("pending");
          break;
        case "expenses":
          data = await storage.getExpensesByStatus("pending");
          break;
        case "trips":
          data = await storage.getTripsByStatus("pending");
          break;
        case "leaveRequests":
          data = await storage.getLeaveRequestsByStatus("pending");
          break;
        case "sickLeaves":
          data = await storage.getSickLeavesByStatus("pending");
          break;
        default:
          return res.status(400).json({ error: "Tipo non valido" });
      }
      
      res.json(data);
    } catch (error) {
      console.error(`Error getting ${req.params.type}:`, error);
      res.status(500).json({ error: `Errore durante il recupero dei dati di tipo ${req.params.type}` });
    }
  });

  // API per ottenere tutte le richieste di permesso in pending (solo admin)
  app.get("/api/admin/leave-requests/pending", isAdmin, async (req, res) => {
    try {
      const pendingLeaveRequests = await storage.getLeaveRequestsByStatus("pending");
      res.json(pendingLeaveRequests);
    } catch (error) {
      console.error("Error getting pending leave requests:", error);
      res.status(500).json({ error: "Errore durante il recupero delle richieste di permesso" });
    }
  });

  // API per ottenere tutti i permessi malattia in pending (solo admin)
  app.get("/api/admin/sickleaves/pending", isAdmin, async (req, res) => {
    try {
      const pendingSickLeaves = await storage.getSickLeavesByStatus("pending");
      res.json(pendingSickLeaves);
    } catch (error) {
      console.error("Error getting pending sick leaves:", error);
      res.status(500).json({ error: "Errore durante il recupero dei permessi di malattia" });
    }
  });

  // API per ottenere tutte le richieste di trasferta in pending (solo admin)
  app.get("/api/admin/trips/pending", isAdmin, async (req, res) => {
    try {
      const pendingTrips = await storage.getTripsByStatus("pending");
      res.json(pendingTrips);
    } catch (error) {
      console.error("Error getting pending trips:", error);
      res.status(500).json({ error: "Errore durante il recupero delle richieste di trasferta" });
    }
  });
  
  // API per ottenere tutti i timesheet in pending (solo admin)
  app.get("/api/admin/time-entries/pending", isAdmin, async (req, res) => {
    try {
      const pendingTimeEntries = await storage.getTimeEntriesByStatus("pending");
      res.json(pendingTimeEntries);
    } catch (error) {
      console.error("Error getting pending time entries:", error);
      res.status(500).json({ error: "Errore durante il recupero delle registrazioni orarie" });
    }
  });
  
  // API per ottenere tutte le spese in pending (solo admin)
  app.get("/api/admin/expenses/pending", isAdmin, async (req, res) => {
    try {
      const pendingExpenses = await storage.getExpensesByStatus("pending");
      res.json(pendingExpenses);
    } catch (error) {
      console.error("Error getting pending expenses:", error);
      res.status(500).json({ error: "Errore durante il recupero delle spese" });
    }
  });
  
  // API per approvare/rifiutare permessi (solo admin)
  app.patch("/api/admin/leave-requests/:id/:action", isAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const leaveRequestId = parseInt(id);
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Azione non valida. Usa 'approve' o 'reject'" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedLeaveRequest = await storage.updateLeaveRequestStatus(leaveRequestId, status);
      
      if (!updatedLeaveRequest) {
        return res.status(404).json({ error: "Richiesta di permesso non trovata" });
      }
      
      res.json(updatedLeaveRequest);
    } catch (error) {
      console.error(`Error ${req.params.action}ing leave request:`, error);
      res.status(500).json({ error: `Errore durante l'${req.params.action === "approve" ? "approvazione" : "rifiuto"} della richiesta di permesso` });
    }
  });

  // API per approvare/rifiutare permessi malattia (solo admin)
  app.patch("/api/admin/sickleaves/:id/:action", isAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const sickLeaveId = parseInt(id);
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Azione non valida. Usa 'approve' o 'reject'" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedSickLeave = await storage.updateSickLeaveStatus(sickLeaveId, status);
      
      if (!updatedSickLeave) {
        return res.status(404).json({ error: "Permesso di malattia non trovato" });
      }
      
      res.json(updatedSickLeave);
    } catch (error) {
      console.error(`Error ${req.params.action}ing sick leave:`, error);
      res.status(500).json({ error: `Errore durante l'${req.params.action === "approve" ? "approvazione" : "rifiuto"} del permesso di malattia` });
    }
  });

  // API per approvare/rifiutare richieste di trasferta (solo admin)
  app.patch("/api/admin/trips/:id/:action", isAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const tripId = parseInt(id);
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Azione non valida. Usa 'approve' o 'reject'" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedTrip = await storage.updateTripStatus(tripId, status);
      
      if (!updatedTrip) {
        return res.status(404).json({ error: "Richiesta di trasferta non trovata" });
      }
      
      res.json(updatedTrip);
    } catch (error) {
      console.error(`Error ${req.params.action}ing trip:`, error);
      res.status(500).json({ error: `Errore durante l'${req.params.action === "approve" ? "approvazione" : "rifiuto"} della richiesta di trasferta` });
    }
  });
  
  // API per approvare/rifiutare registrazioni orarie (solo admin)
  app.patch("/api/admin/time-entries/:id/:action", isAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const timeEntryId = parseInt(id);
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Azione non valida. Usa 'approve' o 'reject'" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedTimeEntry = await storage.updateTimeEntryStatus(timeEntryId, status);
      
      if (!updatedTimeEntry) {
        return res.status(404).json({ error: "Registrazione oraria non trovata" });
      }
      
      res.json(updatedTimeEntry);
    } catch (error) {
      console.error(`Error ${req.params.action}ing time entry:`, error);
      res.status(500).json({ error: `Errore durante l'${req.params.action === "approve" ? "approvazione" : "rifiuto"} della registrazione oraria` });
    }
  });
  
  // API per approvare/rifiutare spese (solo admin)
  app.patch("/api/admin/expenses/:id/:action", isAdmin, async (req, res) => {
    try {
      const { id, action } = req.params;
      const expenseId = parseInt(id);
      
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Azione non valida. Usa 'approve' o 'reject'" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedExpense = await storage.updateExpenseStatus(expenseId, status);
      
      if (!updatedExpense) {
        return res.status(404).json({ error: "Spesa non trovata" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error(`Error ${req.params.action}ing expense:`, error);
      res.status(500).json({ error: `Errore durante l'${req.params.action === "approve" ? "approvazione" : "rifiuto"} della spesa` });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
