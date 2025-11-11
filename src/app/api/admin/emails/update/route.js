import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, active, value } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing ID." }),
        { status: 400 }
      );
    }

    let updateData = {};

    // ✅ If toggling active/inactive
    if (typeof active === "boolean") {
      updateData.active = active;
    }

    // ✅ If updating domain name
    if (value) {
      updateData.value = value;
    }

    const updated = await prisma.allowedEmail.update({
      where: { id },
      data: updateData,
    });

    return new Response(
      JSON.stringify({ success: true, entry: updated }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ PATCH /admin/emails/update error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Update failed." }),
      { status: 500 }
    );
  }
}
