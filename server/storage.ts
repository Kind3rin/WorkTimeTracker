import { 
  User, InsertUser, 
  TimeEntry, InsertTimeEntry,
  Expense, InsertExpense,
  Travel, InsertTravel,
  Leave, InsertLeave,
  Project, InsertProject
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // TimeEntry methods
  getTimeEntries(userId: number): Promise<TimeEntry[]>;
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, entry: Partial<TimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Expense methods
  getExpenses(userId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Travel methods
  getTravels(userId: number): Promise<Travel[]>;
  getTravel(id: number): Promise<Travel | undefined>;
  createTravel(travel: InsertTravel): Promise<Travel>;
  updateTravel(id: number, travel: Partial<Travel>): Promise<Travel | undefined>;
  deleteTravel(id: number): Promise<boolean>;

  // Leave methods
  getLeaves(userId: number): Promise<Leave[]>;
  getLeave(id: number): Promise<Leave | undefined>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, leave: Partial<Leave>): Promise<Leave | undefined>;
  deleteLeave(id: number): Promise<boolean>;

  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private timeEntries: Map<number, TimeEntry>;
  private expenses: Map<number, Expense>;
  private travels: Map<number, Travel>;
  private leaves: Map<number, Leave>;
  private projects: Map<number, Project>;
  
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private timeEntryCurrentId: number;
  private expenseCurrentId: number;
  private travelCurrentId: number;
  private leaveCurrentId: number;
  private projectCurrentId: number;

  constructor() {
    this.users = new Map();
    this.timeEntries = new Map();
    this.expenses = new Map();
    this.travels = new Map();
    this.leaves = new Map();
    this.projects = new Map();
    
    this.userCurrentId = 1;
    this.timeEntryCurrentId = 1;
    this.expenseCurrentId = 1;
    this.travelCurrentId = 1;
    this.leaveCurrentId = 1;
    this.projectCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create a default project
    this.createProject({
      name: "App Mobile Ecommerce",
      description: "Development of a mobile e-commerce application",
      startDate: new Date("2023-07-01"),
      endDate: new Date("2023-08-31"),
      status: "in_progress",
      progress: 75
    });
    
    this.createProject({
      name: "Sistema gestionale interno",
      description: "Internal management system for the company",
      startDate: new Date("2023-08-15"),
      endDate: new Date("2023-11-30"),
      status: "planning",
      progress: 10
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return [...this.users.values()].find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // TimeEntry methods
  async getTimeEntries(userId: number): Promise<TimeEntry[]> {
    return [...this.timeEntries.values()].filter(entry => entry.userId === userId);
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryCurrentId++;
    const timeEntry: TimeEntry = { ...entry, id };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: number, entryData: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const entry = this.timeEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...entryData };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Expense methods
  async getExpenses(userId: number): Promise<Expense[]> {
    return [...this.expenses.values()].filter(expense => expense.userId === userId);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseCurrentId++;
    const newExpense: Expense = { ...expense, id };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Travel methods
  async getTravels(userId: number): Promise<Travel[]> {
    return [...this.travels.values()].filter(travel => travel.userId === userId);
  }

  async getTravel(id: number): Promise<Travel | undefined> {
    return this.travels.get(id);
  }

  async createTravel(travel: InsertTravel): Promise<Travel> {
    const id = this.travelCurrentId++;
    const newTravel: Travel = { ...travel, id };
    this.travels.set(id, newTravel);
    return newTravel;
  }

  async updateTravel(id: number, travelData: Partial<Travel>): Promise<Travel | undefined> {
    const travel = this.travels.get(id);
    if (!travel) return undefined;
    
    const updatedTravel = { ...travel, ...travelData };
    this.travels.set(id, updatedTravel);
    return updatedTravel;
  }

  async deleteTravel(id: number): Promise<boolean> {
    return this.travels.delete(id);
  }

  // Leave methods
  async getLeaves(userId: number): Promise<Leave[]> {
    return [...this.leaves.values()].filter(leave => leave.userId === userId);
  }

  async getLeave(id: number): Promise<Leave | undefined> {
    return this.leaves.get(id);
  }

  async createLeave(leave: InsertLeave): Promise<Leave> {
    const id = this.leaveCurrentId++;
    const newLeave: Leave = { ...leave, id };
    this.leaves.set(id, newLeave);
    return newLeave;
  }

  async updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave | undefined> {
    const leave = this.leaves.get(id);
    if (!leave) return undefined;
    
    const updatedLeave = { ...leave, ...leaveData };
    this.leaves.set(id, updatedLeave);
    return updatedLeave;
  }

  async deleteLeave(id: number): Promise<boolean> {
    return this.leaves.delete(id);
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return [...this.projects.values()];
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
}

export const storage = new MemStorage();
