import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard - Aggregate dashboard stats
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCargo,
      statusBreakdownRaw,
      categoryBreakdownRaw,
      weightStats,
      activeProjects,
      pendingDispatch,
      equipmentStats,
      movementsToday,
      recentMovements,
      allProjects,
    ] = await Promise.all([
      // Total cargo count
      db.cargoItem.count(),

      // Cargo count by status
      db.cargoItem.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Cargo count by lift category
      db.cargoItem.groupBy({
        by: ['liftCategory'],
        _count: { id: true },
      }),

      // Total weight and volume
      db.cargoItem.aggregate({
        _sum: { weight: true, volume: true },
      }),

      // Active projects (not COMPLETED or SHIPPED)
      db.project.count({
        where: {
          status: { notIn: ['COMPLETED', 'SHIPPED'] },
        },
      }),

      // Pending dispatch (IN_YARD or IN_WAREHOUSE)
      db.cargoItem.count({
        where: {
          status: { in: ['IN_YARD', 'IN_WAREHOUSE'] },
        },
      }),

      // Equipment available count
      db.equipment.count({
        where: { status: 'AVAILABLE' },
      }),

      // Movements today
      db.movement.count({
        where: { createdAt: { gte: today } },
      }),

      // Recent movements (last 10)
      db.movement.findMany({
        take: 10,
        include: {
          cargoItem: true,
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // All projects with cargo counts for progress
      db.project.findMany({
        include: {
          _count: { select: { cargoItems: true } },
        },
        where: {
          status: { notIn: ['COMPLETED', 'SHIPPED'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Build status breakdown
    const statusBreakdown = statusBreakdownRaw.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Build category breakdown
    const categoryBreakdown = categoryBreakdownRaw.map((c) => ({
      category: c.liftCategory,
      count: c._count.id,
    }));

    // Count specific statuses
    const inYard = statusBreakdown.find((s) => s.status === 'IN_YARD')?.count || 0;
    const inWarehouse = statusBreakdown.find((s) => s.status === 'IN_WAREHOUSE')?.count || 0;
    const inTransit = statusBreakdown.find((s) => s.status === 'IN_TRANSIT')?.count || 0;
    const heavyLiftCount = categoryBreakdown.find((c) => c.category === 'HEAVY_LIFT')?.count || 0;
    const oversizeCount = categoryBreakdown.find((c) => c.category === 'OVERSIZE')?.count || 0;

    // Build project progress
    const projectProgress = allProjects.map((p) => ({
      name: p.name,
      projectCode: p.projectCode,
      total: p.totalItems,
      received: p._count.cargoItems,
      status: p.status,
      clientName: p.clientName,
    }));

    const stats = {
      totalCargo,
      inYard,
      inWarehouse,
      inTransit,
      totalWeight: weightStats._sum.weight || 0,
      totalVolume: weightStats._sum.volume || 0,
      activeProjects,
      pendingDispatch,
      equipmentAvailable: equipmentStats,
      movementsToday,
      heavyLiftCount,
      oversizeCount,
      statusBreakdown,
      categoryBreakdown,
      recentMovements,
      projectProgress,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
