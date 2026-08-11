import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/track/[code] — Public, no auth, rate-limited (10 req/min/IP)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, remaining } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const { code } = await params;

    const cargo = await db.cargoItem.findUnique({
      where: { cargoCode: code.toUpperCase() },
      include: {
        location: { select: { name: true, code: true } },
        project: { select: { name: true, projectCode: true } },
        movements: {
          select: {
            type: true,
            createdAt: true,
            fromLocation: { select: { name: true, code: true } },
            toLocation: { select: { name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 });
    }

    // Return limited public-safe data
    return NextResponse.json({
      data: {
        cargoCode: cargo.cargoCode,
        description: cargo.description,
        status: cargo.status,
        weight: cargo.weight,
        liftCategory: cargo.liftCategory,
        location: cargo.location ? { name: cargo.location.name, code: cargo.location.code } : null,
        project: cargo.project ? { name: cargo.project.name, projectCode: cargo.project.projectCode } : null,
        lastMovement: cargo.movements[0] || null,
        receivedAt: cargo.receivedAt,
        dispatchedAt: cargo.dispatchedAt,
      },
    }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
