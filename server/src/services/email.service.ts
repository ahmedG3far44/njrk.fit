import { env } from "../configs/env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});


export const sendEmail = async (html: string, to: string, subject: string) => {
  const mailOptions = {
    from: env.EMAIL_USER,
    to,
    subject,
    html,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Failed to send email:", error);
  }
};
