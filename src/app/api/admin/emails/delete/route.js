import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing ID." }),
        { status: 400 }
      );
    }

    await prisma.allowedEmail.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Deleted successfully." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE /admin/emails/delete error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Delete failed." }),
      { status: 500 }
    );
  }
}
