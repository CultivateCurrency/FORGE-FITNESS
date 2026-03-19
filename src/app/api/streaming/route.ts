import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createIvsChannel } from "@/lib/ivs";

// GET /api/streaming — List streams with filters and pagination
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default-tenant";
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") as "LIVE" | "SCHEDULED" | "ENDED" | null;
    const type = searchParams.get("type") as "PUBLIC" | "MEMBERS_ONLY" | "PAY_PER_VIEW" | "GROUP_ONLY" | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { host: { select: { id: true, fullName: true, profilePhoto: true } } },
      }),
      prisma.stream.count({ where }),
    ]);

    // Strip stream keys from response (security)
    const sanitized = streams.map(({ streamKey, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: { streams: sanitized, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error("[GET /api/streaming]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch streams" },
      { status: 500 }
    );
  }
}

// POST /api/streaming — Create / schedule a stream (creates IVS channel)
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default-tenant";
    const body = await req.json();

    const { hostId, title, category, type, scheduledAt, price } = body;

    if (!hostId || !title) {
      return NextResponse.json(
        { success: false, error: "hostId and title are required" },
        { status: 400 }
      );
    }

    // Create an IVS channel for this stream
    let ivsData = { channelArn: "", streamKey: "", ingestEndpoint: "", playbackUrl: "" };
    try {
      ivsData = await createIvsChannel(`forge-${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`);
    } catch (ivsErr) {
      console.error("[POST /api/streaming] IVS channel creation failed:", ivsErr);
      // Continue without IVS — stream record is still created
    }

    const stream = await prisma.stream.create({
      data: {
        tenantId,
        hostId,
        title,
        category: category || null,
        type: type || "PUBLIC",
        status: "SCHEDULED",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        price: price ?? 0,
        channelArn: ivsData.channelArn || null,
        streamKey: ivsData.streamKey || null,
        ingestEndpoint: ivsData.ingestEndpoint || null,
        playbackUrl: ivsData.playbackUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: stream }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/streaming]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create stream" },
      { status: 500 }
    );
  }
}
