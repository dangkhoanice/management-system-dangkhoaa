import { Router } from "express";
import { db, orders, drivers, vehicles } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res, next) => {
  try {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allDrivers = await db.select().from(drivers);
    const allVehicles = await db.select().from(vehicles);

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.status === "Chờ xử lý").length;
    const completedOrders = allOrders.filter((o) => o.status === "Đã hoàn thành").length;
    const cancelledOrders = allOrders.filter((o) => o.status === "Đã hủy").length;
    const totalRevenue = allOrders.filter((o) => o.status === "Đã hoàn thành" && o.price).reduce((sum, o) => sum + (o.price ?? 0), 0);

    const availableDrivers = allDrivers.filter((d) => d.status === "Sẵn sàng").length;
    const availableVehicles = allVehicles.filter((v) => v.status === "Sẵn sàng").length;

    const recentOrders = allOrders.slice(0, 5);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalDrivers: allDrivers.length,
      availableDrivers,
      totalVehicles: allVehicles.length,
      availableVehicles,
      totalRevenue,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
