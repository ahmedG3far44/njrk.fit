import { env } from "../configs/env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: env.nodemailerHost,
  port: Number(env.nodemailerPort),
  // إذا البورت 465 خله true، غير كذا خله false
  secure: Number(env.nodemailerPort) === 465, 
  auth: {
    user: env.nodemailerUser,
    pass: env.nodemailerPassword,
  },
});

export const sendEmail = async (html: string, to: string, subject: string) => {
  const mailOptions = {
    // هنا خلينا اسم تطبيقك يظهر بشكل أنيق جنب الإيميل
    from: `"Njerka Fit" <${env.nodemailerUser}>`, 
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`); // رسالة تأكيد لك في السيرفر
  } catch (error) {
    console.error("Failed to send email:", error);
    // نرمي الخطأ عشان الدالة اللي استدعت الإرسال تدري إن فيه مشكلة
    throw error; 
  }
};