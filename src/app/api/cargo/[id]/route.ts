import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cargo/[id] - Get single cargo item with location and movements
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cargo = await db.cargoItem.findUnique({
      where: { id },
      include: {
        location: true,
        project: true,
        movements: {
          include: {
            fromLocation: true,
            toLocation: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: cargo });
  } catch (error) {
    console.error('Error fetching cargo item:', error);
    return NextResponse.json({ error: 'Failed to fetch cargo item' }, { status: 500 });
  }
}

// PUT /api/cargo/[id] - Update cargo item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.cargoItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cargo item not found' }, { status: 404 });
    }

    // Build update data, only include fields that are provided
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'description', 'weight', 'length', 'width', 'height', 'volume',
      'liftCategory', 'centerOfGravity', 'liftingPoints', 'specialHandling',
      'hazardClass', 'commodityType', 'status', 'locationId', 'projectId',
      'clientName', 'poReference', 'blReference', 'transportWeight',
      'transportLength', 'transportWidth', 'transportHeight',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['weight', 'length', 'width', 'height', 'volume', 'transportWeight', 'transportLength', 'transportWidth', 'transportHeight'].includes(field)) {
          updateData[field] = parseFloat(body[field]);
        } else if (field === 'liftingPoints') {
          updateData[field] = parseInt(body[field], 10);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Handle date fields
    if (body.receivedAt !== undefined) {
      updateData.receivedAt = body.receivedAt ? new Date(body.receivedAt) : null;
    }
    if (body.dispatchedAt !== undefined) {
      updateData.dispatchedAt = body.dispatchedAt ? new Date(body.dispatchedAt) : null;
    }

    const cargo = await db.cargoItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: cargo });
  } catch (error) {
    console.error('Error updating cargo item:', error);
    return NextResponse.json({ error: 'Failed to update cargo item' }, { status: 500 });
  }
}

// DELETE /api/cargo/[id] - Soft delete by changing status to DISPATCHED
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.cargoItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cargo item not found' }, { status: 404 });
    }

    const cargo = await db.cargoItem.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
      },
    });

    return NextResponse.json({ data: cargo, message: 'Cargo item soft-deleted (status set to DISPATCHED)' });
  } catch (error) {
    console.error('Error deleting cargo item:', error);
    return NextResponse.json({ error: 'Failed to delete cargo item' }, { status: 500 });
  }
}
