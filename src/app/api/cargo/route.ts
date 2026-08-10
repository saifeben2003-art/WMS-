import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cargo - List cargo items with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const liftCategory = searchParams.get('liftCategory');
    const query = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const projectId = searchParams.get('projectId');
    const locationId = searchParams.get('locationId');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (liftCategory) where.liftCategory = liftCategory;
    if (projectId) where.projectId = projectId;
    if (locationId) where.locationId = locationId;
    if (query) {
      where.OR = [
        { description: { contains: query } },
        { cargoCode: { contains: query } },
        { clientName: { contains: query } },
        { poReference: { contains: query } },
        { blReference: { contains: query } },
      ];
    }

    const [cargo, total] = await Promise.all([
      db.cargoItem.findMany({
        where,
        include: {
          location: true,
          project: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cargoItem.count({ where }),
    ]);

    return NextResponse.json({
      items: cargo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching cargo items:', error);
    return NextResponse.json({ error: 'Failed to fetch cargo items' }, { status: 500 });
  }
}

// POST /api/cargo - Create a new cargo item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, weight, length, width, height, liftCategory, commodityType } = body;

    // Validate required fields
    if (!description || !weight || !length || !width || !height) {
      return NextResponse.json(
        { error: 'Missing required fields: description, weight, length, width, height' },
        { status: 400 }
      );
    }

    // Generate auto cargo code: CL-YYYY-NNN
    const year = new Date().getFullYear();
    const lastCargo = await db.cargoItem.findFirst({
      where: {
        cargoCode: { startsWith: `CL-${year}-` },
      },
      orderBy: { cargoCode: 'desc' },
    });

    let nextNum = 1;
    if (lastCargo) {
      const parts = lastCargo.cargoCode.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const cargoCode = `CL-${year}-${String(nextNum).padStart(3, '0')}`;

    // Calculate volume in CBM
    const volume = parseFloat(((length * width * height) / 1).toFixed(3));

    const cargo = await db.cargoItem.create({
      data: {
        cargoCode,
        description,
        weight: parseFloat(weight),
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        volume,
        liftCategory: liftCategory || 'STANDARD',
        commodityType: commodityType || 'GENERAL',
        centerOfGravity: body.centerOfGravity || null,
        liftingPoints: body.liftingPoints ? parseInt(body.liftingPoints, 10) : null,
        specialHandling: body.specialHandling || null,
        hazardClass: body.hazardClass || null,
        status: body.status || 'IN_TRANSIT',
        locationId: body.locationId || null,
        projectId: body.projectId || null,
        clientName: body.clientName || null,
        poReference: body.poReference || null,
        blReference: body.blReference || null,
        transportWeight: body.transportWeight ? parseFloat(body.transportWeight) : null,
        transportLength: body.transportLength ? parseFloat(body.transportLength) : null,
        transportWidth: body.transportWidth ? parseFloat(body.transportWidth) : null,
        transportHeight: body.transportHeight ? parseFloat(body.transportHeight) : null,
        receivedAt: body.receivedAt ? new Date(body.receivedAt) : null,
        dispatchedAt: body.dispatchedAt ? new Date(body.dispatchedAt) : null,
      },
    });

    return NextResponse.json({ data: cargo }, { status: 201 });
  } catch (error) {
    console.error('Error creating cargo item:', error);
    return NextResponse.json({ error: 'Failed to create cargo item' }, { status: 500 });
  }
}
