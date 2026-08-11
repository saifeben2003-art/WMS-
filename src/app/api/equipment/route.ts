import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/equipment - List equipment with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;

    const [equipment, total] = await Promise.all([
      db.equipment.findMany({
        where,
        orderBy: { equipmentCode: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.equipment.count({ where }),
    ]);

    return NextResponse.json({
      items: equipment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Generate auto equipment code: EQ-YYYY-NNN
    const year = new Date().getFullYear();
    const lastEq = await db.equipment.findFirst({
      where: {
        equipmentCode: { startsWith: `EQ-${year}-` },
      },
      orderBy: { equipmentCode: 'desc' },
    });

    let nextNum = 1;
    if (lastEq) {
      const parts = lastEq.equipmentCode.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const equipmentCode = `EQ-${year}-${String(nextNum).padStart(3, '0')}`;

    const equipment = await db.equipment.create({
      data: {
        equipmentCode,
        name,
        type,
        capacity: body.capacity ? parseFloat(body.capacity) : null,
        manufacturer: body.manufacturer || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        status: body.status || 'AVAILABLE',
        currentLocation: body.currentLocation || null,
        lastInspection: body.lastInspection ? new Date(body.lastInspection) : null,
        nextInspection: body.nextInspection ? new Date(body.nextInspection) : null,
        certificationId: body.certificationId || null,
        certExpiry: body.certExpiry ? new Date(body.certExpiry) : null,
      },
    });

    return NextResponse.json({ data: equipment }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
