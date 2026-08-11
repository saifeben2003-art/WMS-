import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/movements - List movements with cargo info, location info, date range, type filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const cargoCode = searchParams.get('cargoCode');
    const cargoItemId = searchParams.get('cargoItemId');
    const locationId = searchParams.get('locationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (cargoCode) where.cargoCode = { contains: cargoCode };
    if (cargoItemId) where.cargoItemId = cargoItemId;

    // Date range filter
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    // Location filter - matches either from or to
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    const [movements, total] = await Promise.all([
      db.movement.findMany({
        where,
        include: {
          cargoItem: {
            include: {
              project: true,
            },
          },
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.movement.count({ where }),
    ]);

    return NextResponse.json({
      items: movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 });
  }
}

// POST /api/movements - Create movement with side effects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cargoItemId, type, fromLocationId, toLocationId } = body;

    // Validate required fields
    if (!cargoItemId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: cargoItemId, type' },
        { status: 400 }
      );
    }

    const validTypes = ['RECEIVE', 'MOVE', 'DISPATCH', 'INSPECT'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid movement type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch the cargo item
    const cargoItem = await db.cargoItem.findUnique({
      where: { id: cargoItemId },
    });

    if (!cargoItem) {
      return NextResponse.json({ error: 'Cargo item not found' }, { status: 404 });
    }

    // Validate movement logic
    if (type === 'RECEIVE' && !toLocationId) {
      return NextResponse.json(
        { error: 'RECEIVE movement requires a toLocationId' },
        { status: 400 }
      );
    }

    if (type === 'DISPATCH' && !fromLocationId) {
      return NextResponse.json(
        { error: 'DISPATCH movement requires a fromLocationId' },
        { status: 400 }
      );
    }

    if (type === 'MOVE' && (!fromLocationId || !toLocationId)) {
      return NextResponse.json(
        { error: 'MOVE movement requires both fromLocationId and toLocationId' },
        { status: 400 }
      );
    }

    // Generate auto movement ref: MOV-YYYY-NNN
    const year = new Date().getFullYear();
    const lastMov = await db.movement.findFirst({
      where: {
        movementRef: { startsWith: `MOV-${year}-` },
      },
      orderBy: { movementRef: 'desc' },
    });

    let nextNum = 1;
    if (lastMov) {
      const parts = lastMov.movementRef.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const movementRef = `MOV-${year}-${String(nextNum).padStart(3, '0')}`;

    // Determine new cargo status and location based on movement type
    let newCargoStatus = cargoItem.status;
    let newCargoLocationId = cargoItem.locationId;

    switch (type) {
      case 'RECEIVE':
        newCargoStatus = toLocationId && (await db.location.findUnique({ where: { id: toLocationId } }))?.type === 'WAREHOUSE'
          ? 'IN_WAREHOUSE'
          : 'IN_YARD';
        newCargoLocationId = toLocationId;
        break;
      case 'MOVE':
        newCargoLocationId = toLocationId;
        // Keep status based on new location type
        if (toLocationId) {
          const newLoc = await db.location.findUnique({ where: { id: toLocationId } });
          if (newLoc) {
            newCargoStatus = newLoc.type === 'WAREHOUSE' ? 'IN_WAREHOUSE' : 'IN_YARD';
          }
        }
        break;
      case 'DISPATCH':
        newCargoStatus = 'DISPATCHED';
        newCargoLocationId = null;
        break;
      case 'INSPECT':
        // Inspection doesn't change location or status
        break;
    }

    // Use transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // 1. Create the movement record
      const movement = await tx.movement.create({
        data: {
          movementRef,
          cargoItemId,
          cargoCode: cargoItem.cargoCode,
          type,
          fromLocationId: fromLocationId || null,
          toLocationId: toLocationId || null,
          equipmentUsed: body.equipmentUsed || null,
          liftMethod: body.liftMethod || null,
          operatorName: body.operatorName || null,
          actualWeight: body.actualWeight ? parseFloat(body.actualWeight) : null,
          remarks: body.remarks || null,
          performedBy: body.performedBy || 'SYSTEM',
        },
      });

      // 2. Update cargo item status and location
      const cargoUpdate: Record<string, unknown> = {
        status: newCargoStatus,
        locationId: newCargoLocationId,
      };

      if (type === 'RECEIVE') {
        cargoUpdate.receivedAt = new Date();
      }
      if (type === 'DISPATCH') {
        cargoUpdate.dispatchedAt = new Date();
      }

      await tx.cargoItem.update({
        where: { id: cargoItemId },
        data: cargoUpdate,
      });

      // 3. Update location currentLoad counters
      if (fromLocationId) {
        const fromLoc = await tx.location.findUnique({ where: { id: fromLocationId } });
        if (fromLoc) {
          await tx.location.update({
            where: { id: fromLocationId },
            data: { currentLoad: Math.max(0, fromLoc.currentLoad - 1) },
          });
        }
      }

      if (toLocationId) {
        const toLoc = await tx.location.findUnique({ where: { id: toLocationId } });
        if (toLoc) {
          await tx.location.update({
            where: { id: toLocationId },
            data: { currentLoad: toLoc.currentLoad + 1 },
          });
        }
      }

      return movement;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating movement:', error);
    return NextResponse.json({ error: 'Failed to create movement' }, { status: 500 });
  }
}
