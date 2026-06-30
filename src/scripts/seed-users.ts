import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { sequelize } from "../config/database";
import { User } from "../models/User";
import { UserRole } from "../types";

const seedUsers = async () => {
  await sequelize.authenticate();
  console.log("Connected to database.");

  // Plain text — the User model's beforeCreate hook will hash it
  const plainPassword = "Test@1234";

  const users = [
    {
      name: "Admin User",
      mobile: "9000000001",
      password: plainPassword,
      address: "Temple Street, Chennai",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      name: "Ravi Kumar",
      mobile: "9000000002",
      password: plainPassword,
      address: "12 MG Road, Bangalore",
      role: UserRole.BORROWER,
      isActive: true,
    },
    {
      name: "Priya Sharma",
      mobile: "9000000003",
      password: plainPassword,
      address: "45 Park Avenue, Mumbai",
      role: UserRole.BORROWER,
      isActive: true,
    },
    {
      name: "Suresh Babu",
      mobile: "9000000004",
      password: plainPassword,
      address: "78 Anna Nagar, Chennai",
      role: UserRole.BORROWER,
      isActive: true,
    },
  ];

  for (const userData of users) {
    const [user, created] = await User.findOrCreate({
      where: { mobile: userData.mobile },
      defaults: userData,
    });
    console.log(
      `${created ? "Created" : "Already exists"}: ${user.name} (${user.role}) — mobile: ${user.mobile}`,
    );
  }

  console.log("\n--- Test Credentials ---");
  console.log("Password for all users: Test@1234");
  console.log("Admin    mobile: 9000000001");
  console.log("Borrower mobile: 9000000002, 9000000003, 9000000004");

  await sequelize.close();
};

seedUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
