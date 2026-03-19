import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStreamNotificationEmail } from "@/lib/email";
import { deleteIvsChannel, stopIvsStream, getIvsStream } from "@/lib/ivs";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/streaming/[id] — Get a single stream (with live viewer count from IVS)
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default-tenant";
    const userId = req.headers.get("x-user-id");
    const { id } = await context.params;

    const stream = await prisma.stream.findFirst({
      where: { id, tenantId },
      include: { host: { select: { id: true, fullName: true, profilePhoto: true } } },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    // If stream is LIVE and has a channel, get real-time viewer count from IVS
    let liveViewerCount = stream.viewerCount;
    if (stream.status === "LIVE" && stream.channelArn) {
      try {
        const ivsStream = await getIvsStream(stream.channelArn);
        liveViewerCount = ivsStream.viewerCount;
        // Update stored viewer count
        if (ivsStream.viewerCount !== stream.viewerCount) {
          await prisma.stream.update({
            where: { id },
            data: { viewerCount: ivsStream.viewerCount },
          });
        }
      } catch (e) {
        // IVS call failed, use stored count
      }
    }

    // Only return stream key to the host
    const isHost = userId === stream.hostId;
    const { streamKey, ...rest } = stream;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        viewerCount: liveViewerCount,
        ...(isHost ? { streamKey, ingestEndpoint: stream.ingestEndpoint } : {}),
      },
    });
  } catch (error) {
    console.error("[GET /api/streaming/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stream" },
      { status: 500 }
    );
  }
}

// PUT /api/streaming/[id] — Update stream, go live, or end stream
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default-tenant";
    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.stream.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    const { title, category, type, scheduledAt, price, status } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category;
    if (type !== undefined) data.type = type;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (price !== undefined) data.price = price;

    // Status transitions
    if (status === "LIVE" && existing.status === "SCHEDULED") {
      data.status = "LIVE";
      data.startedAt = new Date();
    } else if (status === "ENDED" && existing.status === "LIVE") {
      data.status = "ENDED";
      data.endedAt = new Date();

      // Stop the IVS stream
      if (existing.channelArn) {
        try {
          await stopIvsStream(existing.channelArn);
        } catch (e) {
          console.error("Failed to stop IVS stream:", e);
        }
      }

      // Get final viewer count from IVS before ending
      if (existing.channelArn) {
        try {
          const ivsStream = await getIvsStream(existing.channelArn);
          data.viewerCount = ivsStream.viewerCount;
        } catch (e) {
          // Use existing count
        }
      }
    } else if (status !== undefined && status !== existing.status) {
      return NextResponse.json(
        { success: false, error: `Invalid status transition from ${existing.status} to ${status}` },
        { status: 400 }
      );
    }

    const stream = await prisma.stream.update({
      where: { id },
      data,
    });

    // Notify followers when coach goes live (non-blocking)
    if (status === "LIVE" && existing.status === "SCHEDULED") {
      const coach = await prisma.user.findUnique({ where: { id: stream.hostId } });
      if (coach) {
        const followers = await prisma.follow.findMany({
          where: { followingId: coach.id },
          include: { follower: { select: { email: true } } },
        });
        for (const f of followers) {
          sendStreamNotificationEmail(
            f.follower.email,
            coach.fullName,
            stream.title
          ).catch((err) => console.error("Stream notification email failed:", err));
        }
      }
    }

    return NextResponse.json({ success: true, data: stream });
  } catch (error) {
    console.error("[PUT /api/streaming/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update stream" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/[id] — Delete a stream (and its IVS channel)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default-tenant";
    const { id } = await context.params;

    const existing = await prisma.stream.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Stream not found" },
        { status: 404 }
      );
    }

    // Delete the IVS channel if it exists
    if (existing.channelArn) {
      try {
        // Stop stream first if live
        if (existing.status === "LIVE") {
          await stopIvsStream(existing.channelArn);
        }
        await deleteIvsChannel(existing.channelArn);
      } catch (e) {
        console.error("Failed to delete IVS channel:", e);
      }
    }

    await prisma.stream.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("[DELETE /api/streaming/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete stream" },
      { status: 500 }
    );
  }
}
