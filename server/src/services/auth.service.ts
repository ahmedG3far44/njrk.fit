import { env } from "../configs/env";
import { jwtUtils } from "../utils/jwt";
import { TOnboarding } from "../routes/auth.route";
import { calculateUserHealthTargets } from "../utils/calculations";
import crypto from "crypto";
import {
  sendEmail,
  sendSubscriptionEmail,
  transporter,
} from "../services/email.service"; // تأكد من مسار الاستيراد

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import stripe from "../configs/stripe";
import User from "../models/user.model";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const registerUser = async (
  provider: "google" | "github" | "email",
  userData: {
    email: string;
    password?: string;
    name: string;
    avatarUrl?: string;
    googleId?: string;
    githubId?: string;
    language?: "en" | "ar";
  },
): Promise<{
  success: boolean;
  message?: string;
  user?: {
    _id: string;
    userId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    onboardingCompleted: boolean;
    subscriptionTier: "BASIC" | "PRO" | "FAMILY";
    stripCustomerId: string;
    language: "en" | "ar";
  };
  accessToken?: string;
  refreshToken?: string;
}> => {
  const { email, password, name, avatarUrl, googleId, githubId, language } =
    userData;

  const placeholder =
    "https://imgs.search.brave.com/XTYb7aqQKvXRuwwA2RPI2PJEiFUM567kRggEPKviqC8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdDMu/ZGVwb3NpdHBob3Rv/cy5jb20vNDExMTc1/OS8xMzQyNS92LzQ1/MC9kZXBvc2l0cGhv/dG9zXzEzNDI1NTUz/Mi1zdG9jay1pbGx1/c3RyYXRpb24tcHJv/ZmlsZS1wbGFjZWhv/bGRlci1tYWxlLWRl/ZmF1bHQtcHJvZmls/ZS5qcGc";

  if (provider === "email" && !password) {
    return { success: false, message: "Password is required" };
  } else if (provider === "google" && !googleId) {
    return { success: false, message: "Google ID is required" };
  } else if (provider === "github" && !githubId) {
    return { success: false, message: "Github ID is required" };
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return { success: false, message: "Email already exists" };
  }

  const customer = await stripe.customers.create({
    email: email,
    name: name,
  });

  let newUser: Record<string, unknown>;
  const baseSubscription = {
    stripeCustomerId: customer.id,
    subscriptionTier: "BASIC" as const,
    stripeSubscriptionId: undefined as string | undefined,
  };

  let verificationToken = "";

  switch (provider) {
    case "google":
      newUser = {
        name,
        email: email.toLowerCase(),
        avatarUrl,
        googleId,
        language: language || "en",
        subscription: {
          ...baseSubscription,
          status: "trialing",
        },
      };
      break;
    case "email":
      // توليد توكن عشوائي
      verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      newUser = {
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password as string),
        avatarUrl: placeholder,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // ينتهي بعد 24 ساعة
        subscription: {
          ...baseSubscription,
          status: "trialing",
        },
      };
      break;
    default:
      newUser = {
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password as string),
        avatarUrl: placeholder,
        language: "en",
        subscription: {
          ...baseSubscription,
          status: "active",
        },
      };
      break;
  }

  console.log("Stripe customer created: ", customer.id);

  const user = await User.create(newUser);

  await sendSubscriptionEmail(user.email, user.name);

  if (provider === "email") {
    // انتبه: يفضل تحط رابط الفرونت اند حقك في ملف الـ env
    const frontendUrl = env.CLIENT_URL || "http://localhost:3000";

    // غير هذا السطر
    // غير هذا السطر وخل الرابط يبدأ بـ CLIENT_URL
    const verificationUrl = `${env.CLIENT_URL}/verify-email/${verificationToken}`;

    const emailHtml = `
            <div style="font-family: Arial, sans-serif; text-align: center; direction: rtl;">
                <h2>مرحباً بك يا ${user.name} 👋</h2>
                <p>سعداء بانضمامك لنا! عشان تفعل حسابك وتبدأ تستخدم التطبيق، اضغط على الزر تحت:</p>
                <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">توثيق الحساب</a>
                <p style="color: #666; font-size: 12px;">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
            </div>
        `;

    // نستخدم خدمتك اللي في email.service.ts
    await sendEmail(emailHtml, user.email, "توثيق حسابك الجديد");
  }

  const payload = {
    _id: user._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    onboardingCompleted: user.onboardingCompleted,
    stripCustomerId: customer.id,
    subscriptionTier: "BASIC" as const,
    language: user.language,
    isEmailVerified: false,
  };

  return {
    success: true,
    message: "User registered successfully",
    user: payload,
    accessToken: jwtUtils.generateAccessToken(payload),
    refreshToken: jwtUtils.generateRefreshToken(payload),
  };
};

export const forgotPassword = async (email: string) => {
  // 1. ندور على اليوزر
  const user = await User.findOne({ email: email.toLowerCase() });

  // ملاحظة أمنية: حتى لو اليوزر مو موجود، نرجع نجاح عشان الهكرز ما يعرفون وش الإيميلات المسجلة عندنا
  if (!user) {
    return {
      success: true,
      message: "إذا كان البريد الإلكتروني مسجلاً لدينا، سيصلك رابط التغيير",
    };
  }

  // 2. نولد توكن عشوائي طويل
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 3. نحفظ التوكن في الداتا بيس ونعطيه صلاحية ساعة واحدة فقط
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // ساعة من الآن
  await user.save();

  // 4. نجهز الرابط اللي بيودي للفرونت اند
  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  // 5. نرسل الإيميل
  const mailOptions = {
    from: `"Njerka Team" <${env.EMAIL_USER}>`,
    to: user.email,
    subject: "إعادة تعيين كلمة المرور - Njerka",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>إعادة تعيين كلمة المرور 🔒</h2>
        <p>لقد استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
        <p>اضغط على الزر أدناه لاختيار كلمة مرور جديدة:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">تغيير كلمة المرور</a>
        <p style="color: #666; font-size: 12px;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب هذا التغيير، يمكنك تجاهل هذه الرسالة.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  return {
    success: true,
    message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
  };
};

// تأكد إنك تستورد مكتبة التشفير إذا مو مستوردها فوق (غالباً bcrypt أو argon2 اللي تستخدمه بمشروعك)

export const resetPassword = async (token: string, newPassword: string) => {
  // 1. ندور على اليوزر اللي عنده نفس التوكن، والتوكن حقه لسه ما انتهت صلاحيته
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }, // $gt يعني أكبر من الوقت الحالي
  });

  if (!user) {
    return {
      success: false,
      message: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",
    };
  }

  // 2. نشفر الباسورد الجديد (استخدم طريقة التشفير المعتمدة في مشروعك)
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);

  // 3. نمسح التوكنات القديمة عشان الرابط ما يشتغل مرة ثانية
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return {
    success: true,
    message: "تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول",
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    return { success: false, message: "Invalid credentials" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Invalid credentials" };
  }


  const payload = {
    _id: user._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    onboardingCompleted: user.onboardingCompleted,
    subscriptionTier: user.subscription?.subscriptionTier as
      | "BASIC"
      | "PRO"
      | "FAMILY",
    language: user.language,
    isEmailVerified: user.isEmailVerified,
  };

  return {
    success: true,
    message: "Login successful",
    user: payload,
    accessToken: jwtUtils.generateAccessToken(payload),
    refreshToken: jwtUtils.generateRefreshToken(payload),
  };
};

export const onboardingUser = async (userId: string, data: TOnboarding) => {
  try {
    console.log("updatting user onboarding data: ", data);
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const daysToReachGoal = data.goalDate
      ? Math.ceil(
          (new Date(data.goalDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : 120;

    const result = calculateUserHealthTargets({
      currentWeightKg: data.weight,
      targetWeightKg: data.targetWeight,
      age: data.age,
      activityLevel: data.activityLevel,
      daysToReachGoal: Math.max(daysToReachGoal, 7),
      goal: data.userGoal,
    });

    console.log(result);

    const { estimatedSteps, estimatedSleepHours, estimatedWaterOz } = result;

    user.weight = data.weight;
    user.height = data.height;
    user.age = data.age;
    user.gender = data.gender;
    user.activityLevel = data.activityLevel;
    user.dietaryRestrictions = data.dietaryRestrictions || [];
    user.religion = data.religion;
    user.allergies = data.allergies;
    user.goal = data.userGoal;
    user.targetWeight = data.targetWeight;
    user.fitnessGoals = data.fitnessGoal;
    user.goalDate = data.goalDate;
    user.onboardingCompleted = true;
    user.estimatedSteps = estimatedSteps;
    user.estimatedSleepHours = estimatedSleepHours;
    user.estimatedWaterOz = estimatedWaterOz;
    if (data.language) user.language = data.language;

    await user.save();
    return { success: true, message: "User onboarded successfully" };
  } catch (error) {
    console.error("User onboarding failed:", error);
    return { success: false, message: "User onboarding failed", error: error };
  }
};

export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email: email.toLowerCase() });
};

export const verifyEmailToken = async (token: string) => {
  // تشفير التوكن اللي وصلنا عشان نقارنه باللي محفوظ في الداتا بيس
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }, // نتأكد إن التوكن ما انتهت صلاحيته
  });

  if (!user) {
    return { success: false, message: "الرمز غير صالح أو منتهي الصلاحية" };
  }

  // إذا التوكن صحيح، نحدث حالة اليوزر
  // (تأكد إنك ضفت isEmailVerified في الـ IUser interface في ملف user.model.ts)
  user.set("isEmailVerified", true);
  user.set("emailVerificationToken", undefined);
  user.set("emailVerificationExpires", undefined);

  await user.save();

  return { success: true, message: "تم توثيق الإيميل بنجاح" };
};

export const resendVerificationEmail = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.isEmailVerified) {
    return { success: false, message: "البريد الإلكتروني موثق بالفعل" };
  }

  if (!user.email) {
    return { success: false, message: "No email associated with this account" };
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verificationUrl = `${env.CLIENT_URL}/verify-email/${verificationToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; text-align: center; direction: rtl;">
      <h2>مرحباً بك يا ${user.name} 👋</h2>
      <p>لعلك طلبت إعادة إرسال رابط التوثيق. اضغط على الزر تحت عشان تفعل حسابك:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">توثيق الحساب</a>
      <p style="color: #666; font-size: 12px;">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
    </div>
  `;

  await sendEmail(emailHtml, user.email, "توثيق حسابك - Njerka");

  return { success: true, message: "تم إرسال رابط التوثيق إلى بريدك الإلكتروني" };
};
