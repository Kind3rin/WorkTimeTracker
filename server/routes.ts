import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertTimeEntrySchema, 
  insertExpenseSchema, 
  insertTravelSchema, 
  insertLeaveSchema, 
  insertProjectSchema 
} from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
function requireAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Projects routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(Number(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Time Entries routes
  app.get("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const timeEntries = await storage.getTimeEntries(req.user!.id);
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const data = insertTimeEntrySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const timeEntry = await storage.createTimeEntry(data);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const timeEntry = await storage.getTimeEntry(Number(req.params.id));
      
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      if (timeEntry.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this time entry" });
      }
      
      const updatedEntry = await storage.updateTimeEntry(Number(req.params.id), req.body);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const timeEntry = await storage.getTimeEntry(Number(req.params.id));
      
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      if (timeEntry.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this time entry" });
      }
      
      await storage.deleteTimeEntry(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getExpenses(req.user!.id);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const data = insertExpenseSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(Number(req.params.id));
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this expense" });
      }
      
      const updatedExpense = await storage.updateExpense(Number(req.params.id), req.body);
      res.json(updatedExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(Number(req.params.id));
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this expense" });
      }
      
      await storage.deleteExpense(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Travel routes
  app.get("/api/travels", requireAuth, async (req, res) => {
    try {
      const travels = await storage.getTravels(req.user!.id);
      res.json(travels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch travels" });
    }
  });

  app.post("/api/travels", requireAuth, async (req, res) => {
    try {
      const data = insertTravelSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const travel = await storage.createTravel(data);
      res.status(201).json(travel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create travel" });
    }
  });

  app.put("/api/travels/:id", requireAuth, async (req, res) => {
    try {
      const travel = await storage.getTravel(Number(req.params.id));
      
      if (!travel) {
        return res.status(404).json({ message: "Travel not found" });
      }
      
      if (travel.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this travel" });
      }
      
      const updatedTravel = await storage.updateTravel(Number(req.params.id), req.body);
      res.json(updatedTravel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update travel" });
    }
  });

  app.delete("/api/travels/:id", requireAuth, async (req, res) => {
    try {
      const travel = await storage.getTravel(Number(req.params.id));
      
      if (!travel) {
        return res.status(404).json({ message: "Travel not found" });
      }
      
      if (travel.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this travel" });
      }
      
      await storage.deleteTravel(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete travel" });
    }
  });

  // Leave routes
  app.get("/api/leaves", requireAuth, async (req, res) => {
    try {
      const leaves = await storage.getLeaves(req.user!.id);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.post("/api/leaves", requireAuth, async (req, res) => {
    try {
      const data = insertLeaveSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const leave = await storage.createLeave(data);
      res.status(201).json(leave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create leave" });
    }
  });

  app.put("/api/leaves/:id", requireAuth, async (req, res) => {
    try {
      const leave = await storage.getLeave(Number(req.params.id));
      
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }
      
      if (leave.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this leave" });
      }
      
      const updatedLeave = await storage.updateLeave(Number(req.params.id), req.body);
      res.json(updatedLeave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update leave" });
    }
  });

  app.delete("/api/leaves/:id", requireAuth, async (req, res) => {
    try {
      const leave = await storage.getLeave(Number(req.params.id));
      
      if (!leave) {
        return res.status(404).json({ message: "Leave not found" });
      }
      
      if (leave.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this leave" });
      }
      
      await storage.deleteLeave(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
