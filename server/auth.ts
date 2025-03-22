import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "worktrack_session_secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        // Verifica se è la prima login (per eventuale cambio password)
        if (user.needsPasswordChange === true) {
          // Aggiungiamo un flag per la modifica della password
          return done(null, {
            ...user,
            needsPasswordChange: true
          });
        }
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // La registrazione è rimossa, solo gli admin possono creare utenti
  // tramite il pannello di amministrazione

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    
    try {
      // Ottieni l'utente dal database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Verifica la password corrente
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password corrente non valida" });
      }
      
      // Aggiorna la password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);
      
      // Se era necessario cambiare la password, rimuoviamo il flag
      if (user.needsPasswordChange) {
        await storage.updateUser(userId, { needsPasswordChange: false });
      }
      
      return res.status(200).json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Errore nel cambio password:", error);
      return res.status(500).json({ message: "Errore nel cambio password" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Validazione token di invito e impostazione nuova password
  app.post("/api/invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token di invito e nuova password sono richiesti" });
      }
      
      // Verifica il token di invito
      const user = await storage.validateInvitationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Token di invito non valido o scaduto" });
      }
      
      // Imposta la nuova password e rimuovi il token di invito
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        needsPasswordChange: false,
        invitationToken: null,
        invitationExpires: null
      });
      
      // Effettua il login automatico dell'utente
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login automatico" });
        }
        return res.status(200).json({ message: "Password impostata con successo" });
      });
    } catch (error) {
      console.error("Errore nella validazione del token di invito:", error);
      return res.status(500).json({ message: "Errore nel server" });
    }
  });
  
  // Verifica validità token di invito
  app.get("/api/invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token di invito richiesto" });
      }
      
      // Verifica il token di invito
      const user = await storage.validateInvitationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Token di invito non valido o scaduto" });
      }
      
      return res.status(200).json({ 
        valid: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          fullName: user.fullName 
        } 
      });
    } catch (error) {
      console.error("Errore nella verifica del token di invito:", error);
      return res.status(500).json({ message: "Errore nel server" });
    }
  });
}
