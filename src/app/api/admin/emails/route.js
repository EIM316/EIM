import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { entry_type, value, description } = body;

    if (!entry_type || !value) {
      return new Response(
        JSON.stringify({ success: false, message: "All fields are required." }),
        { status: 400 }
      );
    }

    // ✅ Check for duplicates (case-insensitive)
    const existing = await prisma.allowedEmail.findFirst({
      where: {
        entry_type,
        value: { equals: value, mode: "insensitive" },
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Entry already exists." }),
        { status: 400 }
      );
    }

    // ✅ Create new record
    const newEntry = await prisma.allowedEmail.create({
      data: {
        entry_type,
        value,
        description: description || null,
        active: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, entry: newEntry }),
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /admin/emails error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
