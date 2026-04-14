import { Router } from "express";
import { db, drivers, assignments, insertDriverSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";
import type { AssignmentWithDetails, DriverDailyStats } from "@workspace/db";

const router = Router();

router.get("/drivers", requireAuth, async (_req, res, next) => {
  try {
    const data = await db.select().from(drivers).orderBy(desc(drivers.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/drivers/:id", requireAuth, async (req, res, next) => {
  try {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, Number(req.params.id)));
    if (!driver) return res.status(404).json({ message: "Không tìm thấy tài xế" });
    res.json(driver);
  } catch (err) {
    next(err);
  }
});

router.get("/drivers/:id/stats/daily", requireAuth, async (req, res, next) => {
  try {
    const driverAssignments = await db.query.assignments.findMany({
      where: eq(assignments.driverId, Number(req.params.id)),
      with: { order: true, vehicle: true, driver: true },
      orderBy: [desc(assignments.assignedAt)],
    }) as AssignmentWithDetails[];

    const statsMap = new Map<string, DriverDailyStats>();
    for (const assignment of driverAssignments) {
      if (!assignment.assignedAt) continue;
      const dateStr = new Date(assignment.assignedAt).toISOString().split("T")[0];
      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, { date: dateStr, totalTrips: 0, trips: [] });
      }
      const stat = statsMap.get(dateStr)!;
      stat.totalTrips += 1;
      stat.trips.push(assignment);
    }

    res.json(Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date)));
  } catch (err) {
    next(err);
  }
});

router.post("/drivers", requireAuth, async (req, res, next) => {
  try {
    const input = insertDriverSchema.parse(req.body);
    const [created] = await db.insert(drivers).values(input).returning();
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.put("/drivers/:id", requireAuth, async (req, res, next) => {
  try {
    const input = insertDriverSchema.partial().parse(req.body);
    const [updated] = await db.update(drivers).set(input).where(eq(drivers.id, Number(req.params.id))).returning();
    if (!updated) return res.status(404).json({ message: "Không tìm thấy tài xế" });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.delete("/drivers/:id", requireAuth, async (req, res, next) => {
  try {
    await db.delete(drivers).where(eq(drivers.id, Number(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
