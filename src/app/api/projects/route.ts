import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/projects - List projects with filters and cargo count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientName = searchParams.get('clientName');
    const query = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (clientName) where.clientName = { contains: clientName };
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { projectCode: { contains: query } },
        { clientName: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          _count: {
            select: { cargoItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    // Transform to include cargoCount from _count
    const data = projects.map((p) => ({
      ...p,
      cargoCount: p._count.cargoItems,
    }));

    return NextResponse.json({
      items: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, clientName } = body;

    // Validate required fields
    if (!name || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, clientName' },
        { status: 400 }
      );
    }

    // Generate auto project code: PRJ-YYYY-NNN
    const year = new Date().getFullYear();
    const lastProject = await db.project.findFirst({
      where: {
        projectCode: { startsWith: `PRJ-${year}-` },
      },
      orderBy: { projectCode: 'desc' },
    });

    let nextNum = 1;
    if (lastProject) {
      const parts = lastProject.projectCode.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const projectCode = `PRJ-${year}-${String(nextNum).padStart(3, '0')}`;

    const project = await db.project.create({
      data: {
        projectCode,
        name,
        description: body.description || null,
        clientName,
        clientContact: body.clientContact || null,
        destination: body.destination || null,
        shippingLine: body.shippingLine || null,
        vesselName: body.vesselName || null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        status: body.status || 'PLANNED',
        totalItems: body.totalItems ? parseInt(body.totalItems, 10) : 0,
        totalWeight: body.totalWeight ? parseFloat(body.totalWeight) : 0,
        totalVolume: body.totalVolume ? parseFloat(body.totalVolume) : 0,
        sapProjectId: body.sapProjectId || null,
        sapContract: body.sapContract || null,
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
