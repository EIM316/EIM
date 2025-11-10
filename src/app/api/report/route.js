import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id_number, email, message, userType } = await req.json();

    // ✅ Validate input
    if (!email || !message || !userType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ✅ Save to database
    const savedReport = await prisma.report.create({
      data: {
        email,
        user_type: userType,
        id_number: id_number || "N/A",
        message,
      },
    });

    // ✅ Email setup (Gmail transporter)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const receiver = process.env.REPORT_RECEIVER_EMAIL || process.env.EMAIL_USER;

    // ✅ Compose email
    const subject = `📩 ${userType.toUpperCase()} Report - ${id_number || "N/A"}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2>New Issue Report</h2>
        <p><b>Type:</b> ${userType === "teacher" ? "Teacher" : "Student"}</p>
        <p><b>ID Number:</b> ${id_number || "N/A"}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <pre style="background:#f8f8f8;padding:12px;border-radius:6px;white-space:pre-wrap;">${message}</pre>
        <hr/>
        <p style="font-size:12px;color:#555;">📨 Sent automatically by the EIM Reporting System</p>
      </div>
    `;

    // ✅ Send email
    await transporter.sendMail({
      from: `"EIM Support" <${process.env.EMAIL_USER}>`,
      to: receiver,
      subject,
      html,
    });

    return NextResponse.json({
      success: true,
      message: "✅ Report submitted and email sent successfully.",
      report: savedReport,
    });
  } catch (err) {
    console.error("❌ Error handling report:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit or send report." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
