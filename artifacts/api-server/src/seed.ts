import { db, users, vehicles, drivers, orders, assignments } from "@workspace/db";
import { hashPassword } from "./middlewares/auth.js";
import { logger } from "./lib/logger.js";

export async function seedDatabase(): Promise<void> {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const adminPassword = await hashPassword("admin123");
    await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      isAdmin: true,
    });
    logger.info("Created default admin account (username: admin, password: admin123)");
  }

  const existingDrivers = await db.select().from(drivers);
  if (existingDrivers.length === 0) {
    const [v1] = await db.insert(vehicles).values({ licensePlate: "51C-123.45", type: "Xe tải 5 tấn", capacity: 5000, status: "Sẵn sàng" }).returning();
    const [v2] = await db.insert(vehicles).values({ licensePlate: "51D-678.90", type: "Container 20ft", capacity: 20000, status: "Sẵn sàng" }).returning();
    await db.insert(vehicles).values({ licensePlate: "51G-456.78", type: "Xe tải 2 tấn", capacity: 2000, status: "Bảo trì" }).returning();

    const [d1] = await db.insert(drivers).values({ name: "Nguyễn Văn An", phone: "0901234567", licenseNumber: "B2-123456", status: "Sẵn sàng" }).returning();
    const [d2] = await db.insert(drivers).values({ name: "Trần Thị Bình", phone: "0912345678", licenseNumber: "C-654321", status: "Sẵn sàng" }).returning();
    await db.insert(drivers).values({ name: "Lê Văn Cường", phone: "0923456789", licenseNumber: "B2-789012", status: "Nghỉ phép" }).returning();

    const [o1] = await db.insert(orders).values({
      orderCode: "DH-20240101-001",
      goodsDescription: "Vật liệu xây dựng, gạch men",
      customerName: "Công ty Xây Dựng ABC",
      customerPhone: "0281234567",
      origin: "Kho Quận 9, TP.HCM",
      destination: "Công trình Bình Dương",
      status: "Chờ xử lý",
      price: 1500000,
      note: "Giao trước 10h sáng",
    }).returning();

    const [o2] = await db.insert(orders).values({
      orderCode: "DH-20240101-002",
      goodsDescription: "Thực phẩm đóng hộp",
      customerName: "Siêu thị XYZ",
      customerPhone: "0289876543",
      origin: "Cảng Cát Lái",
      destination: "Kho Biên Hòa",
      status: "Đã hoàn thành",
      price: 2000000,
      note: "Hàng dễ vỡ",
    }).returning();

    const [o3] = await db.insert(orders).values({
      orderCode: "DH-20240102-001",
      goodsDescription: "Thiết bị điện tử",
      customerName: "Công ty Tech VN",
      customerPhone: "0901111222",
      origin: "Sân Bay Tân Sơn Nhất",
      destination: "Hà Nội",
      status: "Đang vận chuyển",
      price: 5000000,
    }).returning();

    await db.insert(assignments).values({ orderId: o1.id, vehicleId: v1.id, driverId: d1.id });
    await db.insert(assignments).values({ orderId: o2.id, vehicleId: v2.id, driverId: d2.id });

    logger.info("Database seeded with sample data");
  }
}
