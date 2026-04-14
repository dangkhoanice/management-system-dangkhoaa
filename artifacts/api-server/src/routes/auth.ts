import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { db, users, insertUserSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../middlewares/auth.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, (req, res, next) => {
  passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng." });
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      const { password: _, ...safeUser } = user;
      return res.status(200).json(safeUser);
    });
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) logger.warn({ destroyErr }, "Session destroy error");
      res.clearCookie("connect.sid");
      res.sendStatus(200);
    });
  });
});

router.get("/user", requireAuth, (req, res) => {
  const { password: _, ...safeUser } = req.user!;
  res.json(safeUser);
});

router.get("/users", requireAdmin, async (req, res, next) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      isAdmin: users.isAdmin,
    }).from(users);
    res.json(allUsers);
  } catch (err) {
    next(err);
  }
});

router.post("/users", requireAdmin, async (req, res, next) => {
  try {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const existing = await db.select().from(users).where(eq(users.username, parsed.data.username));
    if (existing.length > 0) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    const hashed = await hashPassword(parsed.data.password);
    const [created] = await db.insert(users).values({
      username: parsed.data.username,
      password: hashed,
      isAdmin: parsed.data.isAdmin ?? false,
    }).returning({ id: users.id, username: users.username, isAdmin: users.isAdmin });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
