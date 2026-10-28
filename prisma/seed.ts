import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Mossa backend...\n");

  // 1. Bengkel
  const bengkel = await prisma.bengkel.upsert({
    where: { name: "Mobil Mossa Bengkel" },
    update: {},
    create: {
      name: "Mobil Mossa Bengkel",
      description: "Bengkel penyedia servis kendaraan (Kecil / Besar / Berat).",
      address: "Jl. Raya Langensari, Kab. Sukoharjo, Jawa Tengah",
      phone: "(031) 881-2345",
      email: "admin@mossa.id",
      logoUrl: "https://via.placeholder.com/150",
      openingHours: {
        Mon: "08:00-12:00",
        Tue: "08:00-12:00",
        Wed: "08:00-12:00",
        Thu: "08:00-12:00",
        Fri: "08:00-12:00",
        Sat: "08:00-10:00",
      },
      photoUrl: "https://via.placeholder.com/400x200",
    },
  });
  console.log(`✅ Bengkel: ${bengkel.name}`);

  // 2. Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@mossa.id" },
    update: {},
    create: {
      bengkelId: bengkel.id,
      name: "Admin",
      email: "admin@mossa.id",
      passwordHash: bcrypt.hashSync("admin123", 10),
      role: "admin",
      phone: "(031) 881-2345",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 3. Staff users
  const staff1 = await prisma.user.upsert({
    where: { email: "staff1@mossa.id" },
    update: {},
    create: {
      bengkelId: bengkel.id,
      name: "Budi Santoso",
      email: "staff1@mossa.id",
      passwordHash: bcrypt.hashSync("staff123", 10),
      role: "staff",
      phone: "(031) 881-2346",
    },
  });
  console.log(`✅ Staff: ${staff1.name}`);

  // 4. Default service types
  const types = [
    { name: "Ganti Oli", category: "kecil", description: "Ganti oli mesin & cek rutin", estimatedMinutes: 30, price: 35000 },
    { name: "Tune-up Lengkap", category: "besar", description: "Tune-up lengkap & pengecekan komponen", estimatedMinutes: 120, price: 250000 },
    { name: "Overhaul", category: "berat", description: "Overhaul komponen utama", estimatedMinutes: 480, price: 1200000 },
  ] as const;

  for (const t of types) {
    await prisma.serviceType.create({
      data: { name: t.name, category: t.category, description: t.description, estimatedMinutes: t.estimatedMinutes, price: t.price, bengkelId: bengkel.id },
    });
  }
  console.log("✅ Service types: Kecil / Besar / Berat");

  // 5. Demo customer
  const customer = await prisma.customer.create({
    data: {
      bengkelId: bengkel.id,
      name: "Ahmad S.",
      email: "ahmad@email.com",
      phone: "(0857) 1234-5678",
      address: "Jl. Merdeka No. 45",
      note: "Mobil sedan, hobi gemarspa.",
    },
  });
  console.log(`✅ Customer: ${customer.name}`);

  // 6. Demo vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      bengkelId: bengkel.id,
      customerId: customer.id,
      plate: "B 1234 XYZ",
      brand: "Toyota",
      model: "Avanza",
      year: 2019,
      color: "Silver",
      engineType: "1.5L",
      vin: "WBABC2A58GF123456",
    },
  });
  console.log(`✅ Vehicle: ${vehicle.plate} (${vehicle.brand} ${vehicle.model})`);

  // 7. Demo product (sparepart)
  const product = await prisma.product.create({
    data: {
      bengkelId: bengkel.id,
      name: "Oli Motor Kualitas",
      category: "bahan_bakar",
      sku: "OM-100",
      barcode: "8888888888001",
      unitPrice: 25000,
      stock: 50,
      minStock: 10,
    },
  });
  console.log(`✅ Product: ${product.name} stok=${product.stock}`);

  // 8. Reminder intervals (settings)
  const intervalKeys = ["kecil", "besar", "berat"] as const;
  for (const cat of intervalKeys) {
    await prisma.setting.upsert({
      where: { key_bengkelId: { key: `reminder_interval_${cat}`, bengkelId: bengkel.id } },
      update: { value: String(cat === "kecil" ? 30 : cat === "besar" ? 90 : 180) },
      create: { key: `reminder_interval_${cat}`, value: String(cat === "kecil" ? 30 : cat === "besar" ? 90 : 180), bengkelId: bengkel.id },
    });
  }
  console.log("✅ Reminder intervals: kecil=30, besar=90, berat=180 hari");

  // 9. Demo expense (listrik)
  const expense = await prisma.expense.create({
    data: {
      bengkelId: bengkel.id,
      name: "Tagihan Listrik Bulan Ini",
      category: "listrik",
      amount: 450000,
      paymentMethod: "transfer",
      date: new Date(),
      note: "Tagihan PLN Oktober",
    },
  });
  console.log(`✅ Expense: ${expense.name} Rp${expense.amount}`);

  console.log("\n🎉 Seeding selesai.");
}

void main().finally(async () => {
  await prisma.$disconnect();
});
