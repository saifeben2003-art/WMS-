import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/seed - Seed realistic demo data for a Middle East heavy lift warehouse
export async function POST(request: NextRequest) {
  try {
    let forceReseed = false;
    try {
      const body = await request.json();
      forceReseed = body.force === true;
    } catch {
      // No body or invalid JSON - that's fine, seed normally
    }

    // Check if data already exists
    const existingCargo = await db.cargoItem.count();
    if (existingCargo > 0 && !forceReseed) {
      return NextResponse.json(
        { error: 'Database already has data. Use { "force": true } to reseed.', existingCargo },
        { status: 409 }
      );
    }

    // Clear existing data if force reseed
    if (forceReseed && existingCargo > 0) {
      await db.$transaction([
        db.movement.deleteMany(),
        db.cargoItem.deleteMany(),
        db.project.deleteMany(),
        db.equipment.deleteMany(),
        db.location.deleteMany(),
      ]);
    }

    // ==================== LOCATIONS ====================
    const locations = await Promise.all([
      db.location.create({ data: { code: 'YARD-A1', name: 'Yard A1 - Heavy Lift Zone', type: 'YARD', zone: 'A', maxWeight: 25000, maxDimension: '30m x 10m x 10m', area: 2400, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'YARD-A2', name: 'Yard A2 - Oversize Zone', type: 'YARD', zone: 'A', maxWeight: 15000, maxDimension: '40m x 8m x 6m', area: 3200, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'YARD-A3', name: 'Yard A3 - General Storage', type: 'YARD', zone: 'A', maxWeight: 10000, maxDimension: '20m x 5m x 5m', area: 2000, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'WH-W1', name: 'Warehouse W1 - Climate Controlled', type: 'WAREHOUSE', zone: 'W', maxWeight: 5000, maxDimension: '15m x 4m x 4m', area: 1800, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'WH-W2', name: 'Warehouse W2 - General', type: 'WAREHOUSE', zone: 'W', maxWeight: 8000, maxDimension: '20m x 5m x 5m', area: 2400, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'STG-S1', name: 'Staging Area S1 - Pre-Load', type: 'STAGING', zone: 'S', maxWeight: 30000, maxDimension: '50m x 12m x 12m', area: 5000, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'BERTH-B1', name: 'Berth B1 - Heavy Lift Vessel', type: 'BERTH', zone: 'B', maxWeight: 50000, maxDimension: '60m x 15m x 15m', area: 8000, isActive: true, currentLoad: 0 } }),
      db.location.create({ data: { code: 'OA-C1', name: 'Open Area C1 - Pipe Rack', type: 'OPEN_AREA', zone: 'C', maxWeight: 20000, maxDimension: '25m x 6m x 4m', area: 3000, isActive: true, currentLoad: 0 } }),
    ]);

    const locMap: Record<string, string> = {};
    locations.forEach((l) => { locMap[l.code] = l.id; });

    // ==================== PROJECTS ====================
    const projects = await Promise.all([
      db.project.create({
        data: {
          projectCode: 'PRJ-2024-001', name: 'ADNOC Refinery Module',
          description: 'Offshore processing module for ADNOC Upper Zakum field development. Includes distillation column and associated piping.',
          clientName: 'ADNOC', clientContact: 'Eng. Ahmed Al Maktoum',
          destination: 'Abu Dhabi, UAE - Das Island', shippingLine: 'ADNOC Logistics', vesselName: 'MV FALCON HEAVY',
          etd: new Date('2024-03-15'), eta: new Date('2024-03-18'),
          status: 'STAGING', totalItems: 6, totalWeight: 185000, totalVolume: 2800,
          sapProjectId: 'SAP-ADNOC-RM-2024', sapContract: 'CT-2024-0891',
        },
      }),
      db.project.create({
        data: {
          projectCode: 'PRJ-2024-002', name: 'SAFCO Compressor Station',
          description: 'Gas compressor packages and associated equipment for SAFCO Jubail fertilizer plant expansion.',
          clientName: 'SABIC', clientContact: 'Mohammed Al-Rashidi',
          destination: 'Al Jubail, Saudi Arabia', shippingLine: 'Bahri Heavy Lift', vesselName: 'MV SAUDI STAR',
          etd: new Date('2024-04-01'), eta: new Date('2024-04-05'),
          status: 'IN_STORAGE', totalItems: 4, totalWeight: 95000, totalVolume: 1200,
          sapProjectId: 'SAP-SABIC-CS-2024', sapContract: 'CT-2024-0756',
        },
      }),
      db.project.create({
        data: {
          projectCode: 'PRJ-2024-003', name: 'QatarEnergy LNG Train 8',
          description: 'Heat exchangers and cryogenic columns for North Field LNG expansion project Train 8.',
          clientName: 'QatarEnergy', clientContact: 'Ali Al-Thani',
          destination: 'Ras Laffan, Qatar', shippingLine: 'Qatar Gas Transport', vesselName: 'MV Q-MAX HEAVY',
          etd: new Date('2024-05-10'), eta: new Date('2024-05-14'),
          status: 'RECEIVING', totalItems: 3, totalWeight: 210000, totalVolume: 3500,
          sapProjectId: 'SAP-QE-LNG8-2024', sapContract: 'CT-2024-1023',
        },
      }),
      db.project.create({
        data: {
          projectCode: 'PRJ-2024-004', name: 'ARAMCO Jazan Refinery Spares',
          description: 'Replacement reactor internals and heat exchanger bundles for Jazan refinery turnaround.',
          clientName: 'Saudi Aramco', clientContact: 'Fahad Al-Otaibi',
          destination: 'Jazan, Saudi Arabia', shippingLine: 'Aramco Marine', vesselName: 'TBD',
          etd: new Date('2024-04-20'), eta: new Date('2024-04-23'),
          status: 'PLANNED', totalItems: 5, totalWeight: 42000, totalVolume: 680,
          sapProjectId: 'SAP-ARAMCO-JR-2024', sapContract: 'CT-2024-0945',
        },
      }),
      db.project.create({
        data: {
          projectCode: 'PRJ-2024-005', name: 'ADNOC Ghasha Condo Platform',
          description: 'Sulfur recovery unit modules and gas treatment equipment for Ghasha sour gas development.',
          clientName: 'ADNOC', clientContact: 'Saeed Al-Mansoori',
          destination: 'Abu Dhabi, UAE - Habshan', shippingLine: 'ADNOC Logistics', vesselName: 'MV DESERT PEARL',
          etd: new Date('2024-06-01'), eta: new Date('2024-06-05'),
          status: 'PLANNED', totalItems: 4, totalWeight: 155000, totalVolume: 2100,
          sapProjectId: 'SAP-ADNOC-GH-2024', sapContract: 'CT-2024-1102',
        },
      }),
    ]);

    const projMap: Record<string, string> = {};
    projects.forEach((p) => { projMap[p.projectCode] = p.id; });

    // ==================== EQUIPMENT ====================
    const equipment = await Promise.all([
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-001', name: 'Liebherr LTM 1500-8.1', type: 'CRANE', capacity: 500, manufacturer: 'Liebherr', model: 'LTM 1500-8.1', serialNumber: 'LH-1500-AE-2022', status: 'AVAILABLE', currentLocation: 'YARD-A1', lastInspection: new Date('2024-01-15'), nextInspection: new Date('2024-07-15'), certificationId: 'CERT-CR-2024-001', certExpiry: new Date('2025-01-15') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-002', name: 'Liebherr LTM 1300-6.2', type: 'CRANE', capacity: 300, manufacturer: 'Liebherr', model: 'LTM 1300-6.2', serialNumber: 'LH-1300-AE-2021', status: 'IN_USE', currentLocation: 'STG-S1', lastInspection: new Date('2024-02-10'), nextInspection: new Date('2024-08-10'), certificationId: 'CERT-CR-2024-002', certExpiry: new Date('2025-02-10') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-003', name: 'Tadano GR-1000XL-4', type: 'CRANE', capacity: 100, manufacturer: 'Tadano', model: 'GR-1000XL-4', serialNumber: 'TD-1000-AE-2023', status: 'AVAILABLE', currentLocation: 'YARD-A2', lastInspection: new Date('2024-01-20'), nextInspection: new Date('2024-07-20'), certificationId: 'CERT-CR-2024-003', certExpiry: new Date('2025-01-20') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-004', name: 'Demag AC 50-1', type: 'CRANE', capacity: 50, manufacturer: 'Demag', model: 'AC 50-1', serialNumber: 'DM-050-AE-2022', status: 'MAINTENANCE', currentLocation: 'Workshop', lastInspection: new Date('2023-12-01'), nextInspection: new Date('2024-06-01'), certificationId: 'CERT-CR-2024-004', certExpiry: new Date('2024-12-01') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-005', name: 'Toyota 8FB30', type: 'FORKLIFT', capacity: 3, manufacturer: 'Toyota', model: '8FB30', serialNumber: 'TY-8FB30-2023', status: 'AVAILABLE', currentLocation: 'WH-W1', lastInspection: new Date('2024-02-01'), nextInspection: new Date('2024-08-01'), certificationId: 'CERT-FK-2024-001', certExpiry: new Date('2025-02-01') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-006', name: 'Toyota 8FBE25', type: 'FORKLIFT', capacity: 2.5, manufacturer: 'Toyota', model: '8FBE25', serialNumber: 'TY-8FBE25-2023', status: 'AVAILABLE', currentLocation: 'WH-W2', lastInspection: new Date('2024-02-15'), nextInspection: new Date('2024-08-15'), certificationId: 'CERT-FK-2024-002', certExpiry: new Date('2025-02-15') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-007', name: 'Modulift CMOD 100T Spreader Bar', type: 'SPREADER_BAR', capacity: 100, manufacturer: 'Modulift', model: 'CMOD 100T', serialNumber: 'ML-CM100-2022', status: 'AVAILABLE', currentLocation: 'WH-W1', lastInspection: new Date('2024-01-10'), nextInspection: new Date('2024-07-10'), certificationId: 'CERT-SB-2024-001', certExpiry: new Date('2025-01-10') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-008', name: 'Riggatec 200T Spreader Bar', type: 'SPREADER_BAR', capacity: 200, manufacturer: 'Riggatec', model: 'RT-200T', serialNumber: 'RG-RT200-2023', status: 'IN_USE', currentLocation: 'STG-S1', lastInspection: new Date('2024-02-05'), nextInspection: new Date('2024-08-05'), certificationId: 'CERT-SB-2024-002', certExpiry: new Date('2025-02-05') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-009', name: 'Rope Assemblies - 4-Leg Sling 50T', type: 'SLING', capacity: 50, manufacturer: 'Bridon', model: '4-Leg 50T WLL', serialNumber: 'BR-SL4-50T-2022', status: 'AVAILABLE', currentLocation: 'WH-W1', lastInspection: new Date('2024-01-25'), nextInspection: new Date('2024-07-25'), certificationId: 'CERT-SL-2024-001', certExpiry: new Date('2025-01-25') } }),
      db.equipment.create({ data: { equipmentCode: 'EQ-2024-010', name: 'Heavy Lift Beam 300T WLL', type: 'BEAM', capacity: 300, manufacturer: 'Engineered Lifting', model: 'HLB-300T', serialNumber: 'EL-HLB300-2023', status: 'AVAILABLE', currentLocation: 'YARD-A1', lastInspection: new Date('2024-02-20'), nextInspection: new Date('2024-08-20'), certificationId: 'CERT-BM-2024-001', certExpiry: new Date('2025-02-20') } }),
    ]);

    const eqMap: Record<string, string> = {};
    equipment.forEach((e) => { eqMap[e.equipmentCode] = e.id; });

    // ==================== CARGO ITEMS ====================
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const cargoItems = await db.$transaction([
      // === ADNOC Refinery Module (PRJ-2024-001) ===
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-001', description: 'Distillation Column - Upper Section', weight: 85000, length: 32.5, width: 4.2, height: 4.2, volume: 573.3, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center of column, 16.2m from base', liftingPoints: 4, specialHandling: 'Top heavy - maintain vertical during lift', commodityType: 'MODULE', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1456', blReference: 'MAEU-7823451', transportWeight: 87500, transportLength: 34.0, transportWidth: 5.0, transportHeight: 5.0, receivedAt: twoWeeksAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-002', description: 'Distillation Column - Lower Section', weight: 62000, length: 28.0, width: 3.8, height: 3.8, volume: 404.48, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center of column, 14.0m from base', liftingPoints: 4, specialHandling: 'Sensitive internals - no shock loading', commodityType: 'MODULE', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1457', blReference: 'MAEU-7823452', transportWeight: 64000, transportLength: 29.5, transportWidth: 4.6, transportHeight: 4.6, receivedAt: twoWeeksAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-003', description: 'Reflux Drum Package', weight: 18500, length: 8.5, width: 4.0, height: 4.0, volume: 136.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center', liftingPoints: 4, specialHandling: 'Pressure vessel - handle per P&ID', commodityType: 'EQUIPMENT', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1458', blReference: 'MAEU-7823453', transportWeight: 19200, transportLength: 9.2, transportWidth: 4.5, transportHeight: 4.5, receivedAt: oneWeekAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-004', description: 'Interconnecting Piping Spool Set A', weight: 8500, length: 22.0, width: 3.5, height: 2.5, volume: 192.5, liftCategory: 'OVERSIZE', centerOfGravity: 'Offset - 12m from end', liftingPoints: 6, specialHandling: 'Fragile flanges - protect with timber cradles', commodityType: 'STEEL', status: 'IN_YARD', locationId: locMap['YARD-A2'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1459', blReference: 'MAEU-7823454', transportWeight: 9000, transportLength: 23.0, transportWidth: 4.0, transportHeight: 3.2, receivedAt: oneWeekAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-005', description: 'Module Skid Base Frame', weight: 12000, length: 18.0, width: 8.0, height: 2.5, volume: 360.0, liftCategory: 'PROJECT_CARGO', centerOfGravity: 'Geometric center', liftingPoints: 8, specialHandling: 'Transport frame - do not remove crating until final positioning', commodityType: 'STEEL', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1460', blReference: 'MAEU-7823455', transportWeight: 12800, transportLength: 19.0, transportWidth: 8.5, transportHeight: 3.0, receivedAt: oneWeekAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-006', description: 'Control Room Module (Pre-fab)', weight: 15000, length: 12.0, width: 4.0, height: 4.5, volume: 216.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Slightly offset - electrical panel side', liftingPoints: 4, specialHandling: 'Temperature controlled - avoid direct sun exposure', commodityType: 'MODULE', status: 'IN_WAREHOUSE', locationId: locMap['WH-W1'], projectId: projMap['PRJ-2024-001'], clientName: 'ADNOC', poReference: 'PO-ADNOC-2024-1461', blReference: 'MAEU-7823456', transportWeight: 16200, transportLength: 12.5, transportWidth: 4.5, transportHeight: 5.0, receivedAt: threeDaysAgo } }),

      // === SAFCO Compressor Station (PRJ-2024-002) ===
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-007', description: 'Gas Compressor Package - Main', weight: 42000, length: 15.0, width: 5.5, height: 5.0, volume: 412.5, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Motor end heavy - COG at 6.5m from drive end', liftingPoints: 4, specialHandling: 'Vibration sensitive - use multi-point lift, no sudden movements', commodityType: 'MACHINERY', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-002'], clientName: 'SABIC', poReference: 'PO-SABIC-2024-0891', blReference: 'HLCU-9123456', transportWeight: 44500, transportLength: 16.0, transportWidth: 6.0, transportHeight: 5.5, receivedAt: oneWeekAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-008', description: 'Air Cooler Bank (3 x Fin-Fan)', weight: 28000, length: 12.0, width: 8.0, height: 4.5, volume: 432.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Geometric center', liftingPoints: 4, specialHandling: 'Delicate fin tubes - protect from impact', commodityType: 'EQUIPMENT', status: 'IN_YARD', locationId: locMap['YARD-A2'], projectId: projMap['PRJ-2024-002'], clientName: 'SABIC', poReference: 'PO-SABIC-2024-0892', blReference: 'HLCU-9123457', transportWeight: 30000, transportLength: 13.0, transportWidth: 9.0, transportHeight: 5.2, receivedAt: threeDaysAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-009', description: 'Suction Scrubber Vessel', weight: 15000, length: 10.0, width: 3.5, height: 3.5, volume: 122.5, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center of vessel', liftingPoints: 4, specialHandling: 'Pressure vessel with internals - vertical orientation preferred', commodityType: 'EQUIPMENT', status: 'IN_YARD', locationId: locMap['YARD-A3'], projectId: projMap['PRJ-2024-002'], clientName: 'SABIC', poReference: 'PO-SABIC-2024-0893', blReference: 'HLCU-9123458', transportWeight: 15800, transportLength: 10.5, transportWidth: 4.0, transportHeight: 4.0, receivedAt: threeDaysAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-010', description: 'Interstage Cooler Shell', weight: 10000, length: 7.5, width: 3.0, height: 3.0, volume: 67.5, liftCategory: 'STANDARD', centerOfGravity: 'Center', liftingPoints: 4, specialHandling: 'None', commodityType: 'EQUIPMENT', status: 'IN_WAREHOUSE', locationId: locMap['WH-W2'], projectId: projMap['PRJ-2024-002'], clientName: 'SABIC', poReference: 'PO-SABIC-2024-0894', blReference: 'HLCU-9123459', transportWeight: 10500, transportLength: 8.0, transportWidth: 3.5, transportHeight: 3.5, receivedAt: threeDaysAgo } }),

      // === QatarEnergy LNG Train 8 (PRJ-2024-003) ===
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-011', description: 'Main Cryogenic Heat Exchanger (MCHE)', weight: 125000, length: 18.0, width: 6.0, height: 6.0, volume: 648.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center - balanced unit', liftingPoints: 4, specialHandling: 'Extremely fragile aluminum core - no shock, no tilt beyond 2 degrees', commodityType: 'EQUIPMENT', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: projMap['PRJ-2024-003'], clientName: 'QatarEnergy', poReference: 'PO-QE-2024-0567', blReference: 'QGTL-3345678', transportWeight: 132000, transportLength: 19.0, transportWidth: 6.8, transportHeight: 6.8, receivedAt: now } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-012', description: 'Spiral Wound Heat Exchanger', weight: 85000, length: 22.0, width: 5.5, height: 5.5, volume: 665.5, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Center of exchanger body', liftingPoints: 4, specialHandling: 'Pressure tested unit - maintain seal integrity', commodityType: 'EQUIPMENT', status: 'IN_TRANSIT', locationId: null, projectId: projMap['PRJ-2024-003'], clientName: 'QatarEnergy', poReference: 'PO-QE-2024-0568', blReference: 'QGTL-3345679' } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-013', description: 'Cold Box Assembly Module', weight: 65000, length: 14.0, width: 5.0, height: 8.0, volume: 560.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Upper section heavier due to insulation - COG at 4.8m from base', liftingPoints: 4, specialHandling: 'Cryogenic insulation - protect from moisture, no forklift contact', commodityType: 'MODULE', status: 'IN_TRANSIT', locationId: null, projectId: projMap['PRJ-2024-003'], clientName: 'QatarEnergy', poReference: 'PO-QE-2024-0569', blReference: 'QGTL-3345680' } }),

      // === ARAMCO Jazan Refinery (PRJ-2024-004) - planned/not received yet ===
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-014', description: 'Reactor Internals Basket', weight: 8000, length: 6.0, width: 3.0, height: 3.0, volume: 54.0, liftCategory: 'STANDARD', centerOfGravity: 'Center', liftingPoints: 4, specialHandling: 'Precision machined - no impact', commodityType: 'EQUIPMENT', status: 'IN_TRANSIT', locationId: null, projectId: projMap['PRJ-2024-004'], clientName: 'Saudi Aramco', poReference: 'PO-ARAMCO-2024-0334', blReference: 'TBD' } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-015', description: 'Heat Exchanger Bundle - E-101A', weight: 12000, length: 12.0, width: 2.0, height: 2.0, volume: 48.0, liftCategory: 'OVERSIZE', centerOfGravity: 'Center', liftingPoints: 2, specialHandling: 'Tube bundle - support along full length during lift', commodityType: 'EQUIPMENT', status: 'IN_TRANSIT', locationId: null, projectId: projMap['PRJ-2024-004'], clientName: 'Saudi Aramco', poReference: 'PO-ARAMCO-2024-0335', blReference: 'TBD' } }),

      // === General cargo (no project) ===
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-016', description: 'Steel Pipe Bundle - 24" API 5L X65', weight: 250000, length: 18.0, width: 6.0, height: 3.5, volume: 378.0, liftCategory: 'PROJECT_CARGO', centerOfGravity: 'Distributed load', liftingPoints: 8, specialHandling: 'Coated pipe - protect coating from chains', commodityType: 'STEEL', status: 'IN_YARD', locationId: locMap['OA-C1'], projectId: null, clientName: 'National Petroleum Construction Co.', poReference: 'PO-NPCC-2024-0112', blReference: 'TBD', receivedAt: twoWeeksAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-017', description: 'Transformer 132kV 60MVA', weight: 75000, length: 8.0, width: 3.5, height: 4.5, volume: 126.0, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Core heavy - COG at 1.2m from base', liftingPoints: 4, specialHandling: 'Oil filled - maintain upright, no tilting', commodityType: 'EQUIPMENT', status: 'IN_YARD', locationId: locMap['YARD-A1'], projectId: null, clientName: 'Abu Dhabi Distribution Co.', poReference: 'PO-ADDC-2024-0789', blReference: 'MAEU-8234561', receivedAt: oneWeekAgo } }),
      db.cargoItem.create({ data: { cargoCode: 'CL-2024-018', description: 'Diesel Generator Set 2.5MW', weight: 15000, length: 8.5, width: 2.8, height: 3.2, volume: 76.16, liftCategory: 'HEAVY_LIFT', centerOfGravity: 'Generator end heavy', liftingPoints: 4, specialHandling: 'Vibration mounts fitted - lift from frame points only', commodityType: 'MACHINERY', status: 'IN_WAREHOUSE', locationId: locMap['WH-W2'], projectId: null, clientName: 'Etihad Airways Engineering', poReference: 'PO-EAE-2024-0456', blReference: 'HLCU-9234567', receivedAt: threeDaysAgo } }),
    ]);

    const cargoMap: Record<string, string> = {};
    cargoItems.forEach((c) => { cargoMap[c.cargoCode] = c.id; });

    // ==================== MOVEMENTS ====================
    await db.$transaction([
      // Receiving movements for ADNOC items
      db.movement.create({ data: { movementRef: 'MOV-2024-001', cargoItemId: cargoMap['CL-2024-001'], cargoCode: 'CL-2024-001', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-010']}`, liftMethod: 'BEAM', operatorName: 'Rajesh Kumar', actualWeight: 87500, remarks: 'Received from Antwerp via MV FALCON HEAVY. Lifted using 500T crane with 300T beam.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-002', cargoItemId: cargoMap['CL-2024-002'], cargoCode: 'CL-2024-002', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-008']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Rajesh Kumar', actualWeight: 64000, remarks: 'Received alongside CL-2024-001. Same vessel discharge operation.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-003', cargoItemId: cargoMap['CL-2024-003'], cargoCode: 'CL-2024-003', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-003']},${eqMap['EQ-2024-007']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Singh Baldev', actualWeight: 19200, remarks: 'Drum received on flatbed trailer from Jebel Ali port.', performedBy: 'OPS-Ahmed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-004', cargoItemId: cargoMap['CL-2024-016'], cargoCode: 'CL-2024-016', type: 'RECEIVE', toLocationId: locMap['OA-C1'], equipmentUsed: `${eqMap['EQ-2024-001']}`, liftMethod: 'MULTIPOINT', operatorName: 'Rajesh Kumar', actualWeight: 250000, remarks: 'Pipe bundle delivered by NPCC convoy from Mussafah pipe mill. 8-point lift using lifting beams.', performedBy: 'OPS-Mohammed' } }),

      // Movement operations
      db.movement.create({ data: { movementRef: 'MOV-2024-005', cargoItemId: cargoMap['CL-2024-004'], cargoCode: 'CL-2024-004', type: 'RECEIVE', toLocationId: locMap['YARD-A2'], equipmentUsed: `${eqMap['EQ-2024-003']},${eqMap['EQ-2024-009']}`, liftMethod: 'DIRECT', operatorName: 'Singh Baldev', actualWeight: 9000, remarks: 'Piping spool set received. 6-point sling arrangement used for offset COG.', performedBy: 'OPS-Ahmed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-006', cargoItemId: cargoMap['CL-2024-005'], cargoCode: 'CL-2024-005', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-003']}`, liftMethod: 'DIRECT', operatorName: 'Singh Baldev', actualWeight: 12800, remarks: 'Skid base received on SPMT from fabrication yard.', performedBy: 'OPS-Ahmed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-007', cargoItemId: cargoMap['CL-2024-006'], cargoCode: 'CL-2024-006', type: 'RECEIVE', toLocationId: locMap['WH-W1'], equipmentUsed: `${eqMap['EQ-2024-005']},${eqMap['EQ-2024-003']}`, liftMethod: 'DIRECT', operatorName: 'Ali Hassan', actualWeight: 16200, remarks: 'Control room module placed in climate controlled warehouse per client requirement.', performedBy: 'OPS-Mohammed' } }),

      // SAFCO items
      db.movement.create({ data: { movementRef: 'MOV-2024-008', cargoItemId: cargoMap['CL-2024-007'], cargoCode: 'CL-2024-007', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-010']},${eqMap['EQ-2024-008']}`, liftMethod: 'BEAM', operatorName: 'Rajesh Kumar', actualWeight: 44500, remarks: 'Main compressor received from Hyundai Heavy Industries. Complex lift requiring tandem crane operation.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-009', cargoItemId: cargoMap['CL-2024-008'], cargoCode: 'CL-2024-008', type: 'RECEIVE', toLocationId: locMap['YARD-A2'], equipmentUsed: `${eqMap['EQ-2024-002']},${eqMap['EQ-2024-008']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Singh Baldev', actualWeight: 30000, remarks: 'Air cooler bank delivered from Hamriyah Free Zone. 200T spreader bar used for 4-point lift.', performedBy: 'OPS-Ahmed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-010', cargoItemId: cargoMap['CL-2024-009'], cargoCode: 'CL-2024-009', type: 'RECEIVE', toLocationId: locMap['YARD-A3'], equipmentUsed: `${eqMap['EQ-2024-003']},${eqMap['EQ-2024-007']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Ali Hassan', actualWeight: 15800, remarks: 'Suction scrubber discharged from MV SAUDI STAR at Jebel Ali.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-011', cargoItemId: cargoMap['CL-2024-010'], cargoCode: 'CL-2024-010', type: 'RECEIVE', toLocationId: locMap['WH-W2'], equipmentUsed: `${eqMap['EQ-2024-005']},${eqMap['EQ-2024-003']}`, liftMethod: 'DIRECT', operatorName: 'Ali Hassan', actualWeight: 10500, remarks: 'Interstage cooler placed in warehouse for protection.', performedBy: 'OPS-Ahmed' } }),

      // General cargo movements
      db.movement.create({ data: { movementRef: 'MOV-2024-012', cargoItemId: cargoMap['CL-2024-017'], cargoCode: 'CL-2024-017', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-008']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Rajesh Kumar', actualWeight: 75000, remarks: '132kV transformer received from Siemens factory. Oil filled unit - upright transport maintained.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-013', cargoItemId: cargoMap['CL-2024-018'], cargoCode: 'CL-2024-018', type: 'RECEIVE', toLocationId: locMap['WH-W2'], equipmentUsed: `${eqMap['EQ-2024-003']},${eqMap['EQ-2024-006']}`, liftMethod: 'DIRECT', operatorName: 'Singh Baldev', actualWeight: 15000, remarks: 'Diesel gen-set for Etihad. Placed in warehouse pending site readiness.', performedBy: 'OPS-Ahmed' } }),

      // QatarEnergy receiving
      db.movement.create({ data: { movementRef: 'MOV-2024-014', cargoItemId: cargoMap['CL-2024-011'], cargoCode: 'CL-2024-011', type: 'RECEIVE', toLocationId: locMap['YARD-A1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-002']},${eqMap['EQ-2024-010']}`, liftMethod: 'BEAM', operatorName: 'Rajesh Kumar', actualWeight: 132000, remarks: 'MCHE received from Air Products. Tandem 500T + 300T crane lift with 300T beam. Critical lift plan approved.', performedBy: 'OPS-Mohammed' } }),

      // Staging moves for ADNOC Refinery Module
      db.movement.create({ data: { movementRef: 'MOV-2024-015', cargoItemId: cargoMap['CL-2024-001'], cargoCode: 'CL-2024-001', type: 'MOVE', fromLocationId: locMap['YARD-A1'], toLocationId: locMap['STG-S1'], equipmentUsed: `${eqMap['EQ-2024-001']},${eqMap['EQ-2024-002']},${eqMap['EQ-2024-010']}`, liftMethod: 'BEAM', operatorName: 'Rajesh Kumar', actualWeight: 87500, remarks: 'Moved to staging for pre-load inspection and vessel stowage planning. Tandem crane lift.', performedBy: 'OPS-Mohammed' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-016', cargoItemId: cargoMap['CL-2024-003'], cargoCode: 'CL-2024-003', type: 'MOVE', fromLocationId: locMap['YARD-A1'], toLocationId: locMap['STG-S1'], equipmentUsed: `${eqMap['EQ-2024-002']},${eqMap['EQ-2024-008']}`, liftMethod: 'SPREADER_BAR', operatorName: 'Singh Baldev', actualWeight: 19200, remarks: 'Reflux drum staged for loading alongside distillation column.', performedBy: 'OPS-Ahmed' } }),

      // Inspection
      db.movement.create({ data: { movementRef: 'MOV-2024-017', cargoItemId: cargoMap['CL-2024-001'], cargoCode: 'CL-2024-001', type: 'INSPECT', fromLocationId: locMap['STG-S1'], toLocationId: locMap['STG-S1'], equipmentUsed: null, liftMethod: null, operatorName: 'QC-Hassan Ali', actualWeight: null, remarks: 'Pre-load inspection completed. All lifting lugs verified. COG markings confirmed. No damage observed.', performedBy: 'QC-Team' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-018', cargoItemId: cargoMap['CL-2024-007'], cargoCode: 'CL-2024-007', type: 'INSPECT', fromLocationId: locMap['YARD-A1'], toLocationId: locMap['YARD-A1'], equipmentUsed: null, liftMethod: null, operatorName: 'QC-Khalid Omar', actualWeight: null, remarks: 'Compressor package inspection. Alignment bolts torqued. Nameplate verified. Oil level checked.', performedBy: 'QC-Team' } }),

      // Inspection of pipe bundle (received 2 weeks ago - routine check)
      db.movement.create({ data: { movementRef: 'MOV-2024-019', cargoItemId: cargoMap['CL-2024-016'], cargoCode: 'CL-2024-016', type: 'INSPECT', fromLocationId: locMap['OA-C1'], toLocationId: locMap['OA-C1'], equipmentUsed: null, liftMethod: null, operatorName: 'QC-Rashid Ahmad', actualWeight: null, remarks: 'Routine 14-day inspection of pipe bundle. Coating condition verified - no damage. Pipe ends protected.', performedBy: 'QC-Team' } }),
      db.movement.create({ data: { movementRef: 'MOV-2024-020', cargoItemId: cargoMap['CL-2024-017'], cargoCode: 'CL-2024-017', type: 'INSPECT', fromLocationId: locMap['YARD-A1'], toLocationId: locMap['YARD-A1'], equipmentUsed: null, liftMethod: null, operatorName: 'QC-Fatima Al-Zaabi', actualWeight: null, remarks: 'Transformer pre-dispatch inspection. Bushings checked, oil sample taken, gasket condition verified.', performedBy: 'QC-Team' } }),
    ]);

    // Update location currentLoad counts to match actual cargo
    // Also update cargo items that were moved to staging (CL-2024-001, CL-2024-003)
    await db.$transaction([
      db.location.update({ where: { code: 'YARD-A1' }, data: { currentLoad: 3 } }),
      db.location.update({ where: { code: 'YARD-A2' }, data: { currentLoad: 2 } }),
      db.location.update({ where: { code: 'YARD-A3' }, data: { currentLoad: 1 } }),
      db.location.update({ where: { code: 'WH-W1' }, data: { currentLoad: 1 } }),
      db.location.update({ where: { code: 'WH-W2' }, data: { currentLoad: 2 } }),
      db.location.update({ where: { code: 'STG-S1' }, data: { currentLoad: 2 } }),
      db.location.update({ where: { code: 'BERTH-B1' }, data: { currentLoad: 0 } }),
      db.location.update({ where: { code: 'OA-C1' }, data: { currentLoad: 1 } }),
      // Update cargo items that were moved to staging
      db.cargoItem.update({ where: { cargoCode: 'CL-2024-001' }, data: { locationId: locMap['STG-S1'], status: 'IN_YARD' } }),
      db.cargoItem.update({ where: { cargoCode: 'CL-2024-003' }, data: { locationId: locMap['STG-S1'], status: 'IN_YARD' } }),
    ]);

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      summary: {
        locations: locations.length,
        projects: projects.length,
        equipment: equipment.length,
        cargoItems: cargoItems.length,
        movements: 20,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}

// GET /api/seed - Check if data exists and reseed
export async function GET() {
  try {
    const [cargoCount, projectCount, locationCount, equipmentCount, movementCount] = await Promise.all([
      db.cargoItem.count(),
      db.project.count(),
      db.location.count(),
      db.equipment.count(),
      db.movement.count(),
    ]);

    const hasData = cargoCount > 0 || projectCount > 0;

    return NextResponse.json({
      hasData,
      counts: { cargoItems: cargoCount, projects: projectCount, locations: locationCount, equipment: equipmentCount, movements: movementCount },
      message: hasData
        ? 'Database has existing data. POST with { "force": true } to clear and reseed.'
        : 'Database is empty. POST to /api/seed to populate demo data.',
    });
  } catch (error) {
    console.error('Error checking seed status:', error);
    return NextResponse.json({ error: 'Failed to check seed status' }, { status: 500 });
  }
}
