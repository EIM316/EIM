import { PrismaClient } from "@/generated/prisma";

const prismaGlobal = globalThis.prismaGlobal || {};
const prisma = prismaGlobal.prisma || new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = { prisma };

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code)
      return new Response(
        JSON.stringify({ success: false, error: "Missing game code." }),
        { status: 400 }
      );

    const records = await prisma.classGameRecord.findMany({
      where: { game_code: code },
      include: {
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return new Response(JSON.stringify({ success: true, records }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching game records:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
