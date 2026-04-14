import { Router } from "express";
import { db, vehicles, insertVehicleSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

router.get("/vehicles", requireAuth, async (_req, res, next) => {
  try {
    const data = await db.select().from(vehicles).orderBy(desc(vehicles.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/vehicles", requireAuth, async (req, res, next) => {
  try {
    const schema = insertVehicleSchema.extend({ capacity: z.coerce.number().optional() });
    const input = schema.parse(req.body);
    const [created] = await db.insert(vehicles).values(input).returning();
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.put("/vehicles/:id", requireAuth, async (req, res, next) => {
  try {
    const schema = insertVehicleSchema.partial().extend({ capacity: z.coerce.number().optional() });
    const input = schema.parse(req.body);
    const [updated] = await db.update(vehicles).set(input).where(eq(vehicles.id, Number(req.params.id))).returning();
    if (!updated) return res.status(404).json({ message: "Không tìm thấy phương tiện" });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.delete("/vehicles/:id", requireAuth, async (req, res, next) => {
  try {
    await db.delete(vehicles).where(eq(vehicles.id, Number(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
