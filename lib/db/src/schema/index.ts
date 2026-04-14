import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const VEHICLE_STATUS = ['Sẵn sàng', 'Bảo trì', 'Đang sử dụng'] as const;
export const DRIVER_STATUS = ['Sẵn sàng', 'Nghỉ phép', 'Đang đi chuyến'] as const;
export const ORDER_STATUS = ['Chờ xử lý', 'Đã phân công', 'Đang vận chuyển', 'Đã hoàn thành', 'Đã hủy'] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull().unique(),
  type: text("type").notNull(),
  capacity: integer("capacity"),
  status: text("status", { enum: VEHICLE_STATUS }).default('Sẵn sàng').notNull(),
  note: text("note"),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  status: text("status", { enum: DRIVER_STATUS }).default('Sẵn sàng').notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  goodsDescription: text("goods_description").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  status: text("status", { enum: ORDER_STATUS }).default('Chờ xử lý').notNull(),
  price: integer("price"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  order: one(orders, { fields: [assignments.orderId], references: [orders.id] }),
  vehicle: one(vehicles, { fields: [assignments.vehicleId], references: [vehicles.id] }),
  driver: one(drivers, { fields: [assignments.driverId], references: [drivers.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  assignments: many(assignments),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  assignments: many(assignments),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  assignments: many(assignments),
}));

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, assignedAt: true, completedAt: true });

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type AssignmentWithDetails = Assignment & {
  order: Order;
  vehicle: Vehicle;
  driver: Driver;
};

export type DriverDailyStats = {
  date: string;
  totalTrips: number;
  trips: AssignmentWithDetails[];
};
