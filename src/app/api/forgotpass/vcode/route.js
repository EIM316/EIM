import { PrismaClient } from "@/generated/prisma";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, email } = body;

    if (!id_number || !email) {
      return new Response(
        JSON.stringify({ error: "ID Number and Email are required." }),
        { status: 400 }
      );
    }

    // 🔍 Check across Student, Teacher, and Admin tables
    const student = await prisma.student.findUnique({ where: { id_number } });
    const teacher = await prisma.teacher.findUnique({ where: { id_number } });
    const admin = await prisma.admin.findUnique({ where: { admin_id: id_number } });

    let matchedUser = null;
    let userType = null;

    if (student && student.email === email) {
      matchedUser = student;
      userType = "student";
    } else if (teacher && teacher.email === email) {
      matchedUser = teacher;
      userType = "teacher";
    } else if (admin && admin.email === email) {
      matchedUser = admin;
      userType = "admin";
    }

    if (!matchedUser) {
      return new Response(
        JSON.stringify({
          error: "No matching record found for that ID number and email.",
        }),
        { status: 404 }
      );
    }

    // 🕒 Cooldown check (1 minute between requests)
    const lastCode = await prisma.forgotPasswordCode.findFirst({
      where: { id_number, email },
      orderBy: { created_at: "desc" },
    });

    const now = new Date();
    if (lastCode) {
      const diff = (now.getTime() - lastCode.created_at.getTime()) / 1000;
      if (diff < 60) {
        return new Response(
          JSON.stringify({
            error: `Please wait ${Math.ceil(
              60 - diff
            )} seconds before requesting a new code.`,
          }),
          { status: 429 }
        );
      }
    }

    // 🔢 Generate a 6-digit OTP
    const verification_code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expires_at = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins

    // ✅ Save code in DB (auto-clean can happen in verify route)
    await prisma.forgotPasswordCode.create({
      data: { id_number, email, verification_code, expires_at },
    });

    // 📧 Setup Gmail SMTP Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // ✅ Send Email with Code
    await transporter.sendMail({
      from: `"EIM Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Reset Verification</h2>
          <p>Hello ${matchedUser.first_name},</p>
          <p>We received a request to reset your EIM account password.</p>
          <p>Your verification code is:</p>
          <h1 style="color: #BC2A2A; letter-spacing: 5px;">${verification_code}</h1>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <hr />
          <p style="font-size: 12px; color: #777;">
            If you didn’t request this, please ignore this email.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({
        message: "Verification code sent successfully.",
        role: userType,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Failed to send verification code. Please try again or check your Gmail app password.",
      }),
      { status: 500 }
    );
  }
}
