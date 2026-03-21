import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [followers, following] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { followers, following },
    });
  } catch (error: any) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
