import Admin from "../models/admin.model";
import { env } from "../configs/env";
import { hashPassword } from "../services/adminAuth.service";

export const seedAdmins = async () => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn(
      "ADMIN_EMAIL or ADMIN_PASSWORD is not set in the environment variables. Skipping admin seeding.",
    );
    return;
  }

  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL });

  if (existing) {
    console.log(
      `Admin with email ${env.ADMIN_EMAIL} already exists. Skipping seeding.`,
    );
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD as string);
  await Admin.create({
    email: env.ADMIN_EMAIL,
    passwordHash,
    name: "Admin",
    role: "super_admin",
  });
};
