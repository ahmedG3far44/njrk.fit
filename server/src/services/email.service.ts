import { env } from "../configs/env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: env.nodemailerHost,
  port: Number(env.nodemailerPort),
  secure: false,
  auth: {
    user: env.nodemailerUser,
    pass: env.nodemailerPassword,
  },
});


export const sendEmail = async (html: string, to: string, subject: string) => {
  const mailOptions = {
    from: env.nodemailerUser,
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
