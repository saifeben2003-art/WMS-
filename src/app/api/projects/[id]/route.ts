import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects/[id] - Get single project with cargo items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        cargoItems: {
          include: {
            location: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'description', 'clientName', 'clientContact',
      'destination', 'shippingLine', 'vesselName', 'status',
      'totalItems', 'totalWeight', 'totalVolume',
      'sapProjectId', 'sapContract',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['totalItems'].includes(field)) {
          updateData[field] = parseInt(body[field], 10);
        } else if (['totalWeight', 'totalVolume'].includes(field)) {
          updateData[field] = parseFloat(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Handle date fields
    if (body.etd !== undefined) {
      updateData.etd = body.etd ? new Date(body.etd) : null;
    }
    if (body.eta !== undefined) {
      updateData.eta = body.eta ? new Date(body.eta) : null;
    }

    const project = await db.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.project.findUnique({
      where: { id },
      include: { _count: { select: { cargoItems: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project has cargo items
    if (existing._count.cargoItems > 0) {
      return NextResponse.json(
        { error: `Cannot delete project with ${existing._count.cargoItems} cargo items. Remove or reassign cargo items first.` },
        { status: 409 }
      );
    }

    await db.project.delete({ where: { id } });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
