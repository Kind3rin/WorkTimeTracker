import { users, type User, type InsertUser } from "@shared/schema";
import { projects, type Project, type InsertProject } from "@shared/schema";
import { activityTypes, type ActivityType, type InsertActivityType } from "@shared/schema";
import { timeEntries, type TimeEntry, type InsertTimeEntry } from "@shared/schema";
import { expenses, type Expense, type InsertExpense } from "@shared/schema";
import { trips, type Trip, type InsertTrip } from "@shared/schema";
import { leaveRequests, type LeaveRequest, type InsertLeaveRequest } from "@shared/schema";
import { sickLeaves, type SickLeave, type InsertSickLeave } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>; // Nuovo metodo per admin
  createInvitation(userId: number, token: string, expiresIn: number): Promise<User | undefined>;
  validateInvitationToken(token: string): Promise<User | undefined>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Activity Type methods
  getActivityType(id: number): Promise<ActivityType | undefined>;
  getActivityTypes(): Promise<ActivityType[]>;
  getActivityTypesByCategory(category: string): Promise<ActivityType[]>;
  createActivityType(activityType: InsertActivityType): Promise<ActivityType>;
  
  // Time Entry methods
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<TimeEntry[]>;
  getTimeEntriesByStatus(status: string): Promise<TimeEntry[]>; // Nuovo metodo per admin
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntryStatus(id: number, status: string): Promise<TimeEntry | undefined>;
  
  // Expense methods
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByUser(userId: number): Promise<Expense[]>;
  getExpensesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByStatus(status: string): Promise<Expense[]>; // Nuovo metodo per admin
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: number, status: string): Promise<Expense | undefined>;
  
  // Trip methods
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByUser(userId: number): Promise<Trip[]>;
  getTripsByUserAndStatus(userId: number, status: string): Promise<Trip[]>;
  getTripsByStatus(status: string): Promise<Trip[]>; // Nuovo metodo per admin
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTripStatus(id: number, status: string): Promise<Trip | undefined>;
  
  // Leave Request methods
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]>;
  getLeaveRequestsByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<LeaveRequest[]>;
  getLeaveRequestsByStatus(status: string): Promise<LeaveRequest[]>; // Nuovo metodo per admin
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequestStatus(id: number, status: string): Promise<LeaveRequest | undefined>;
  
  // Sick Leave methods
  getSickLeave(id: number): Promise<SickLeave | undefined>;
  getSickLeavesByUser(userId: number): Promise<SickLeave[]>;
  getSickLeavesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<SickLeave[]>;
  getSickLeavesByStatus(status: string): Promise<SickLeave[]>; // Nuovo metodo per admin
  createSickLeave(sickLeave: InsertSickLeave): Promise<SickLeave>;
  updateSickLeave(id: number, sickLeave: Partial<InsertSickLeave>): Promise<SickLeave | undefined>;
  updateSickLeaveStatus(id: number, status: string): Promise<SickLeave | undefined>; // Nuovo metodo per admin
  deleteSickLeave(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: ReturnType<typeof createMemoryStore>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private activityTypes: Map<number, ActivityType>;
  private timeEntries: Map<number, TimeEntry>;
  private expenses: Map<number, Expense>;
  private trips: Map<number, Trip>;
  private leaveRequests: Map<number, LeaveRequest>;
  private sickLeaves: Map<number, SickLeave>;
  
  sessionStore: ReturnType<typeof createMemoryStore>;
  
  private userCurrentId: number;
  private projectCurrentId: number;
  private activityTypeCurrentId: number;
  private timeEntryCurrentId: number;
  private expenseCurrentId: number;
  private tripCurrentId: number;
  private leaveRequestCurrentId: number;
  private sickLeaveCurrentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.activityTypes = new Map();
    this.timeEntries = new Map();
    this.expenses = new Map();
    this.trips = new Map();
    this.leaveRequests = new Map();
    this.sickLeaves = new Map();
    
    this.userCurrentId = 1;
    this.projectCurrentId = 1;
    this.activityTypeCurrentId = 1;
    this.timeEntryCurrentId = 1;
    this.expenseCurrentId = 1;
    this.tripCurrentId = 1;
    this.leaveRequestCurrentId = 1;
    this.sickLeaveCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize default activity types
    this.createActivityType({ name: "Development", category: "work", description: "Software development tasks" });
    this.createActivityType({ name: "Meeting", category: "work", description: "Team or client meetings" });
    this.createActivityType({ name: "Testing", category: "work", description: "QA and testing tasks" });
    this.createActivityType({ name: "Vacation", category: "time_off", description: "Vacation days" });
    this.createActivityType({ name: "Sick Leave", category: "time_off", description: "Sick leave days" });
    this.createActivityType({ name: "Personal Leave", category: "time_off", description: "Personal time off" });
    
    // Initialize default projects
    this.createProject({ name: "Internal", description: "Internal company activities", client: "Our Company", status: "active" });
    this.createProject({ name: "App E-commerce", description: "E-commerce mobile app", client: "Client XYZ", status: "active" });
    this.createProject({ name: "Portale Aziendale", description: "Company portal project", client: "Client ABC", status: "active" });
    this.createProject({ name: "Sistema CRM", description: "CRM System development", client: "Client DEF", status: "active" });
    
    // Crea l'utente amministratore di default
    // In una implementazione reale, questa password dovrebbe essere caricata da una variabile d'ambiente
    // o un file di configurazione protetto
    this.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "f959786059e2efa550adcd973c32d246c2a2aa6b38537ca2a49dfe5ca9e5d0da4d2573425207c306958a6a4ff83324a31ef83a5c217561823be93625e12ec81a.1eb1c4eff9d05872096ff2fb5f151a8e", // password: "admin123"
      fullName: "Amministratore",
      role: "admin",
      needsPasswordChange: true, // Forza il cambio password al primo accesso
      invitationSent: false,
      invitationToken: null,
      invitationExpires: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, role };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(userId: number, password: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, password };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async createInvitation(userId: number, token: string, expiresIn: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + expiresIn);
    
    const updatedUser = { 
      ...user, 
      invitationToken: token,
      invitationExpires,
      invitationSent: true,
      needsPasswordChange: true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async validateInvitationToken(token: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.invitationToken === token
    );
    
    if (!user) {
      return undefined;
    }
    
    // Verifica se il token è scaduto
    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return undefined;
    }
    
    return user;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  // Activity Type methods
  async getActivityType(id: number): Promise<ActivityType | undefined> {
    return this.activityTypes.get(id);
  }
  
  async getActivityTypes(): Promise<ActivityType[]> {
    return Array.from(this.activityTypes.values());
  }
  
  async getActivityTypesByCategory(category: string): Promise<ActivityType[]> {
    return Array.from(this.activityTypes.values()).filter(
      (type) => type.category === category
    );
  }
  
  async createActivityType(activityType: InsertActivityType): Promise<ActivityType> {
    const id = this.activityTypeCurrentId++;
    const newType: ActivityType = { ...activityType, id };
    this.activityTypes.set(id, newType);
    return newType;
  }
  
  // Time Entry methods
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }
  
  async getTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (entry) => entry.userId === userId
    );
  }
  
  async getTimeEntriesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (entry) => {
        const entryDate = new Date(entry.date);
        return entry.userId === userId && 
          entryDate >= startDate && 
          entryDate <= endDate;
      }
    );
  }
  
  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryCurrentId++;
    const createdAt = new Date();
    const newEntry: TimeEntry = { ...timeEntry, id, createdAt };
    this.timeEntries.set(id, newEntry);
    return newEntry;
  }
  
  async getTimeEntriesByStatus(status: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(
      (entry) => entry.status === status
    );
  }
  
  async updateTimeEntryStatus(id: number, status: string): Promise<TimeEntry | undefined> {
    const entry = this.timeEntries.get(id);
    if (entry) {
      const updatedEntry = { ...entry, status };
      this.timeEntries.set(id, updatedEntry);
      return updatedEntry;
    }
    return undefined;
  }
  
  // Expense methods
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async getExpensesByUser(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );
  }
  
  async getExpensesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => {
        const expenseDate = new Date(expense.date);
        return expense.userId === userId && 
          expenseDate >= startDate && 
          expenseDate <= endDate;
      }
    );
  }
  
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseCurrentId++;
    const createdAt = new Date();
    const newExpense: Expense = { ...expense, id, createdAt };
    this.expenses.set(id, newExpense);
    return newExpense;
  }
  
  async getExpensesByStatus(status: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.status === status
    );
  }
  
  async updateExpenseStatus(id: number, status: string): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (expense) {
      const updatedExpense = { ...expense, status };
      this.expenses.set(id, updatedExpense);
      return updatedExpense;
    }
    return undefined;
  }
  
  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }
  
  async getTripsByUser(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.userId === userId
    );
  }
  
  async getTripsByUserAndStatus(userId: number, status: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.userId === userId && trip.status === status
    );
  }
  
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const id = this.tripCurrentId++;
    const createdAt = new Date();
    const newTrip: Trip = { ...trip, id, createdAt };
    this.trips.set(id, newTrip);
    return newTrip;
  }
  
  async getTripsByStatus(status: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.status === status
    );
  }
  
  async updateTripStatus(id: number, status: string): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (trip) {
      const updatedTrip = { ...trip, status };
      this.trips.set(id, updatedTrip);
      return updatedTrip;
    }
    return undefined;
  }
  
  // Leave Request methods
  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }
  
  async getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(
      (request) => request.userId === userId
    );
  }
  
  async getLeaveRequestsByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(
      (request) => {
        return request.userId === userId && 
          ((new Date(request.startDate) <= endDate && new Date(request.endDate) >= startDate));
      }
    );
  }
  
  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = this.leaveRequestCurrentId++;
    const createdAt = new Date();
    const newRequest: LeaveRequest = { ...leaveRequest, id, createdAt };
    this.leaveRequests.set(id, newRequest);
    return newRequest;
  }
  
  async getLeaveRequestsByStatus(status: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(
      (request) => request.status === status
    );
  }
  
  async updateLeaveRequestStatus(id: number, status: string): Promise<LeaveRequest | undefined> {
    const request = this.leaveRequests.get(id);
    if (request) {
      const updatedRequest = { ...request, status };
      this.leaveRequests.set(id, updatedRequest);
      return updatedRequest;
    }
    return undefined;
  }
  
  // Sick Leave methods
  async getSickLeave(id: number): Promise<SickLeave | undefined> {
    return this.sickLeaves.get(id);
  }
  
  async getSickLeavesByUser(userId: number): Promise<SickLeave[]> {
    return Array.from(this.sickLeaves.values()).filter(
      (leave) => leave.userId === userId
    );
  }
  
  async getSickLeavesByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<SickLeave[]> {
    return Array.from(this.sickLeaves.values()).filter(
      (leave) => {
        return leave.userId === userId && 
          ((new Date(leave.startDate) <= endDate && new Date(leave.endDate) >= startDate));
      }
    );
  }
  
  async createSickLeave(sickLeave: InsertSickLeave): Promise<SickLeave> {
    const id = this.sickLeaveCurrentId++;
    const createdAt = new Date();
    const newSickLeave: SickLeave = { ...sickLeave, id, createdAt };
    this.sickLeaves.set(id, newSickLeave);
    return newSickLeave;
  }
  
  async getSickLeavesByStatus(status: string): Promise<SickLeave[]> {
    return Array.from(this.sickLeaves.values()).filter(
      (leave) => leave.status === status
    );
  }
  
  async updateSickLeave(id: number, sickLeave: Partial<InsertSickLeave>): Promise<SickLeave | undefined> {
    const leave = this.sickLeaves.get(id);
    if (leave) {
      const updatedLeave = { ...leave, ...sickLeave };
      this.sickLeaves.set(id, updatedLeave);
      return updatedLeave;
    }
    return undefined;
  }
  
  async updateSickLeaveStatus(id: number, status: string): Promise<SickLeave | undefined> {
    const leave = this.sickLeaves.get(id);
    if (leave) {
      const updatedLeave = { ...leave, status };
      this.sickLeaves.set(id, updatedLeave);
      return updatedLeave;
    }
    return undefined;
  }
  
  async deleteSickLeave(id: number): Promise<boolean> {
    return this.sickLeaves.delete(id);
  }
}

export const storage = new MemStorage();
