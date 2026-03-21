import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, fullName: true, username: true, profilePhoto: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const blockedUsers = blocks.map((b) => b.blocked);

    return NextResponse.json({ success: true, data: blockedUsers });
  } catch (error: any) {
    console.error("Blocked users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blocked users" },
      { status: 500 }
    );
  }
}
