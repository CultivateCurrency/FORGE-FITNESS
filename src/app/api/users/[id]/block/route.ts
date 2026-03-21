import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Block a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: blockedId } = await params;

    if (userId === blockedId) {
      return NextResponse.json(
        { success: false, error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    await prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId },
      },
      update: {},
      create: { blockerId: userId, blockedId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Block user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to block user" },
      { status: 500 }
    );
  }
}

// Unblock a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: blockedId } = await params;

    await prisma.block.deleteMany({
      where: { blockerId: userId, blockedId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unblock user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unblock user" },
      { status: 500 }
    );
  }
}
