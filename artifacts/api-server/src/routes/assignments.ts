import { Router } from "express";
import { db, assignments, orders, insertAssignmentSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";
import type { AssignmentWithDetails } from "@workspace/db";

const router = Router();

async function getAssignmentWithDetails(id: number): Promise<AssignmentWithDetails | undefined> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    with: { order: true, vehicle: true, driver: true },
  });
  return assignment as AssignmentWithDetails | undefined;
}

router.get("/assignments", requireAuth, async (_req, res, next) => {
  try {
    const data = await db.query.assignments.findMany({
      with: { order: true, vehicle: true, driver: true },
      orderBy: [desc(assignments.id)],
    }) as AssignmentWithDetails[];
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/assignments", requireAuth, async (req, res, next) => {
  try {
    const schema = insertAssignmentSchema.extend({
      orderId: z.coerce.number(),
      vehicleId: z.coerce.number(),
      driverId: z.coerce.number(),
    });
    const input = schema.parse(req.body);
    const [created] = await db.insert(assignments).values(input).returning();
    await db.update(orders).set({ status: "Đã phân công", updatedAt: new Date() }).where(eq(orders.id, input.orderId));
    const withDetails = await getAssignmentWithDetails(created.id);
    res.status(201).json(withDetails);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.put("/assignments/:id", requireAuth, async (req, res, next) => {
  try {
    const schema = insertAssignmentSchema.partial().extend({
      orderId: z.coerce.number().optional(),
      vehicleId: z.coerce.number().optional(),
      driverId: z.coerce.number().optional(),
      completedAt: z.string().nullable().optional(),
    });
    const input = schema.parse(req.body);
    await db.update(assignments).set(input).where(eq(assignments.id, Number(req.params.id)));
    const withDetails = await getAssignmentWithDetails(Number(req.params.id));
    if (!withDetails) return res.status(404).json({ message: "Không tìm thấy phân công" });
    res.json(withDetails);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    next(err);
  }
});

router.delete("/assignments/:id", requireAuth, async (req, res, next) => {
  try {
    await db.delete(assignments).where(eq(assignments.id, Number(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
