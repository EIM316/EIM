import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, code } = body;

    if (!id_number || !code) {
      return new Response(
        JSON.stringify({ error: "ID Number and verification code are required." }),
        { status: 400 }
      );
    }

    // Fetch the latest code entry for this user
    const lastCode = await prisma.forgotPasswordCode.findFirst({
      where: { id_number },
      orderBy: { created_at: "desc" },
    });

    if (!lastCode) {
      return new Response(
        JSON.stringify({ error: "No verification code found for this ID." }),
        { status: 404 }
      );
    }

    // Check expiration
    const now = new Date();
    if (now > lastCode.expires_at) {
      // Delete expired code as well
      await prisma.forgotPasswordCode.delete({
        where: { id: lastCode.id },
      });
      return new Response(
        JSON.stringify({ error: "Verification code has expired." }),
        { status: 400 }
      );
    }

    // Compare codes (string-safe)
    if (String(lastCode.verification_code) !== String(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code." }),
        { status: 400 }
      );
    }

    // ✅ Verification successful → delete the used code
    await prisma.forgotPasswordCode.delete({
      where: { id: lastCode.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification successful. You may now reset your password.",
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Forgotpass vcode2 Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
