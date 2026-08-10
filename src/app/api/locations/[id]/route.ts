import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/locations/[id] - Get single location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const location = await db.location.findUnique({
      where: { id },
      include: {
        cargoItems: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { cargoItems: true, movementsFrom: true, movementsTo: true },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.location.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // If code is being changed, check for duplicates
    if (body.code && body.code !== existing.code) {
      const duplicate = await db.location.findUnique({ where: { code: body.code } });
      if (duplicate) {
        return NextResponse.json(
          { error: `Location with code "${body.code}" already exists` },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = ['code', 'name', 'type', 'zone', 'maxDimension', 'isActive'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.maxWeight !== undefined) {
      updateData.maxWeight = body.maxWeight ? parseFloat(body.maxWeight) : null;
    }
    if (body.area !== undefined) {
      updateData.area = body.area ? parseFloat(body.area) : null;
    }

    const location = await db.location.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.location.findUnique({
      where: { id },
      include: { _count: { select: { cargoItems: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (existing._count.cargoItems > 0) {
      return NextResponse.json(
        { error: `Cannot delete location with ${existing._count.cargoItems} cargo items. Reassign cargo items first.` },
        { status: 409 }
      );
    }

    await db.location.delete({ where: { id } });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
