import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api'

// GET /api/admin/orders — list all orders (admin)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ['ADMIN', 'OWNER', 'SUPER_ADMIN'])
    if (auth instanceof NextResponse) return auth

    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant'
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { user: { tenantId } }
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (e) {
    console.error('GET /api/admin/orders error:', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}
