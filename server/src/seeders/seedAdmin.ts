import Admin from '../models/admin.model';
import { env } from '../configs/env';
import { hashPassword } from '../services/adminAuth.service';

export const seedAdmins = async () => {
  const admins = [
    {
      email: env.ADMIN_EMAIL_1,
      password: env.ADMIN_PASSWORD_1,
      name: env.ADMIN_NAME_1,
      role: 'super_admin' as const,
    },
    {
      email: env.ADMIN_EMAIL_2,
      password: env.ADMIN_PASSWORD_2,
      name: env.ADMIN_NAME_2,
      role: 'admin' as const,
    },
  ];

  for (const adminData of admins) {
    const existing = await Admin.findOne({ email: adminData.email });
    if (existing) continue;
    const passwordHash = await hashPassword(adminData.password);
    await Admin.create({
      email: adminData.email,
      passwordHash,
      name: adminData.name,
      role: adminData.role,
    });
  }
};
