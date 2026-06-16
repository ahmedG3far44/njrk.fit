import { env } from "../configs/env";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: Number(env.EMAIL_PORT) === 465,
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

export const sendSubscriptionEmail = async (to: string, name: string) => {
  const subject = "Welcome to Njerka!";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #166534;">Welcome, ${name}!</h2>
        <p>Thank you for subscribing to Njerka. We're excited to have you on board.</p>
        <p>Get ready to start your personalized fitness and nutrition journey. Our AI is already preparing a plan for you.</p>
        <a href="https://njerka.xyz" style="display: inline-block; padding: 10px 20px; background-color: #16a34a; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Go to Your Dashboard
        </a>
        <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
          Best,
          <br>
          The Njerka Team
        </p>
      </div>
    </div>
  `;
  await sendEmail(html, to, subject);
};

