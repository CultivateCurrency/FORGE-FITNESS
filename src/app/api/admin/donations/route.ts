import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ['ADMIN', 'OWNER', 'SUPER_ADMIN'])
    if (auth instanceof NextResponse) return auth

    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant'
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { user: { tenantId } },
        include: {
          user: { select: { id: true, fullName: true, email: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donation.count({ where: { user: { tenantId } } }),
    ])

    const totalAmount = await prisma.donation.aggregate({
      where: { user: { tenantId } },
      _sum: { amount: true },
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyAmount = await prisma.donation.aggregate({
      where: { user: { tenantId }, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        data: donations,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        stats: {
          totalAmount: totalAmount._sum.amount || 0,
          monthlyAmount: monthlyAmount._sum.amount || 0,
          totalCount: total,
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch donations' }, { status: 500 })
  }
}
