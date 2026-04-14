import { Router } from "express";
import { db, orders, insertOrderSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

router.get("/orders", requireAuth, async (_req, res, next) => {
  try {
    const data = await db.select().from(orders).orderBy(desc(orders.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/orders", requireAuth, async (req, res, next) => {
  try {
    const schema = insertOrderSchema.extend({ price: z.coerce.number().optional() });
    const input = schema.parse(req.body);
    const [created] = await db.insert(orders).values(input).returning();
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.put("/orders/:id", requireAuth, async (req, res, next) => {
  try {
    const schema = insertOrderSchema.partial().extend({ price: z.coerce.number().optional() });
    const input = schema.parse(req.body);
    const [updated] = await db.update(orders).set({ ...input, updatedAt: new Date() }).where(eq(orders.id, Number(req.params.id))).returning();
    if (!updated) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.delete("/orders/:id", requireAuth, async (req, res, next) => {
  try {
    await db.delete(orders).where(eq(orders.id, Number(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
