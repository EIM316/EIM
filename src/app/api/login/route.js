import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id_number, password } = await req.json();

    if (!id_number || !password) {
      return new Response(
        JSON.stringify({ error: "ID number and password are required." }),
        { status: 400 }
      );
    }

    let user = null;
    let userType = null;

    // ✅ Step 1: Check Admin
    user = await prisma.admin.findUnique({
      where: { admin_id: id_number },
    });
    if (user) userType = "admin";

    // ✅ Step 2: If not found, check Teacher
    if (!user) {
      user = await prisma.teacher.findUnique({
        where: { id_number },
      });
      if (user) userType = "teacher";
    }

    // ✅ Step 3: If not found, check Student
    if (!user) {
      user = await prisma.student.findUnique({
        where: { id_number },
      });
      if (user) userType = "student";
    }

    // ✅ Step 4: Handle user not found
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
      });
    }

    // ✅ Step 5: Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid credentials." }), {
        status: 401,
      });
    }

    // ✅ Step 6: Construct normalized user data
    const normalizedUser = {
      id_number: userType === "admin" ? user.admin_id : user.id_number,
      admin_id: userType === "admin" ? user.admin_id : null, // <---- Pass admin_id for admin accounts
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      avatar: user.avatar,
      role: userType === "admin" ? user.role : userType, // admin role (content_admin, etc.)
    };

    // ✅ Step 7: Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful!",
        userType,
        user: normalizedUser,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
