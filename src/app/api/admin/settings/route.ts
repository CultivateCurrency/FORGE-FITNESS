import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api'

// GET /api/admin/settings — load tenant settings
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ['ADMIN', 'OWNER', 'SUPER_ADMIN'])
    if (auth instanceof NextResponse) return auth

    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant'

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        accentColor: true,
        favicon: true,
        customDomain: true,
        features: true,
        settings: true,
        plan: true,
        status: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: tenant })
  } catch (e) {
    console.error('GET /api/admin/settings error:', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/admin/settings — update tenant settings
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRole(req, ['ADMIN', 'OWNER', 'SUPER_ADMIN'])
    if (auth instanceof NextResponse) return auth

    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant'
    const body = await req.json()

    const { name, logo, primaryColor, accentColor, favicon, customDomain, features, settings } = body

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(accentColor !== undefined && { accentColor }),
        ...(favicon !== undefined && { favicon }),
        ...(customDomain !== undefined && { customDomain }),
        ...(features !== undefined && { features }),
        ...(settings !== undefined && { settings }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        accentColor: true,
        favicon: true,
        customDomain: true,
        features: true,
        settings: true,
        plan: true,
        status: true,
      },
    })

    return NextResponse.json({ success: true, data: tenant })
  } catch (e) {
    console.error('PUT /api/admin/settings error:', e)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
