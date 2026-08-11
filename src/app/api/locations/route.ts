import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/locations - List locations with currentLoad info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const zone = searchParams.get('zone');
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (zone) where.zone = zone;
    if (activeOnly) where.isActive = true;

    const locations = await db.location.findMany({
      where,
      include: {
        _count: {
          select: { cargoItems: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Transform to include computed currentLoad from actual count
    const data = locations.map((loc) => ({
      ...loc,
      currentLoad: loc._count.cargoItems,
    }));

    return NextResponse.json({ items: data, totalPages: 1 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await db.location.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: `Location with code "${code}" already exists` },
        { status: 409 }
      );
    }

    const location = await db.location.create({
      data: {
        code,
        name,
        type: body.type || 'YARD',
        zone: body.zone || null,
        maxWeight: body.maxWeight ? parseFloat(body.maxWeight) : null,
        maxDimension: body.maxDimension || null,
        area: body.area ? parseFloat(body.area) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        currentLoad: 0,
      },
    });

    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
