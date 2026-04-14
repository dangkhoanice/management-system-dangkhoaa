import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db, pool, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      isAdmin: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const parts = stored.split(".");
  if (parts.length !== 2) return false;
  const [hashed, salt] = parts;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export function setupAuth(app: Express): void {
  const PostgresSessionStore = connectPg(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "user_sessions",
      pruneSessionInterval: 60,
    }),
  };

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await getUserByUsername(username);
        if (!user) {
          await new Promise((r) => setTimeout(r, 200));
          return done(null, false, { message: "Invalid credentials" });
        }
        const valid = await comparePasswords(password, user.password);
        if (!valid) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await getUserById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    res.sendStatus(403);
    return;
  }
  next();
}
