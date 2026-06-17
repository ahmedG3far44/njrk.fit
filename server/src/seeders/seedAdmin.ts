import Admin from '../models/admin.model';
import { env } from '../configs/env';
import { hashPassword } from '../services/adminAuth.service';

export const seedAdmins = async () => {
  const adminConfigs = [
    { email: env.ADMIN_EMAIL_1, password: env.ADMIN_PASSWORD_1, name: env.ADMIN_NAME_1, role: 'super_admin' as const },
    { email: env.ADMIN_EMAIL_2, password: env.ADMIN_PASSWORD_2, name: env.ADMIN_NAME_2, role: 'admin' as const },
  ];

  for (const config of adminConfigs) {
    if (!config.email || !config.password || !config.name) continue;
    const existing = await Admin.findOne({ email: config.email });
    if (existing) continue;
    const passwordHash = await hashPassword(config.password);
    await Admin.create({
      email: config.email,
      passwordHash,
      name: config.name,
      role: config.role,
    });
  }
};
