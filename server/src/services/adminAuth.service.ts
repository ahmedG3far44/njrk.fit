import bcrypt from 'bcryptjs';
import Admin from '../models/admin.model';
import { adminJwtUtils } from '../utils/adminJwt';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const loginAdmin = async (email: string, password: string) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return { success: false, message: 'Invalid credentials' };
  }

  if (!admin.isActive) {
    return { success: false, message: 'Admin account is deactivated' };
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return { success: false, message: 'Invalid credentials' };
  }

  admin.lastLogin = new Date();
  await admin.save();

  const token = adminJwtUtils.generateAdminToken({
    _id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  return {
    success: true,
    message: 'Login successful',
    admin: {
      _id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
    token,
  };
};

export const getAdminById = async (id: string) => {
  const admin = await Admin.findById(id).select('-passwordHash');
  if (!admin) return null;
  return {
    _id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
  };
};

export const createAdmin = async (data: { email: string; password: string; name: string; role?: 'admin' | 'super_admin' }) => {
  const existing = await Admin.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    return { success: false, message: 'Admin with this email already exists' };
  }

  const passwordHash = await hashPassword(data.password);
  const admin = await Admin.create({
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    role: data.role || 'admin',
  });

  return {
    success: true,
    message: 'Admin created successfully',
    admin: {
      _id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  };
};
