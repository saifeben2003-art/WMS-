import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/equipment/[id] - Get single equipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await db.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ data: equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// PUT /api/equipment/[id] - Update equipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.equipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'type', 'manufacturer', 'model', 'serialNumber',
      'status', 'currentLocation', 'certificationId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.capacity !== undefined) {
      updateData.capacity = body.capacity ? parseFloat(body.capacity) : null;
    }
    if (body.lastInspection !== undefined) {
      updateData.lastInspection = body.lastInspection ? new Date(body.lastInspection) : null;
    }
    if (body.nextInspection !== undefined) {
      updateData.nextInspection = body.nextInspection ? new Date(body.nextInspection) : null;
    }
    if (body.certExpiry !== undefined) {
      updateData.certExpiry = body.certExpiry ? new Date(body.certExpiry) : null;
    }

    const equipment = await db.equipment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

// DELETE /api/equipment/[id] - Delete equipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.equipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    await db.equipment.delete({ where: { id } });

    return NextResponse.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
