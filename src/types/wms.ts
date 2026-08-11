// ==================== HEAVY LIFT WMS TYPES ====================

export type LiftCategory = 'STANDARD' | 'HEAVY_LIFT' | 'OVERSIZE' | 'PROJECT_CARGO';
export type CommodityType = 'GENERAL' | 'MACHINERY' | 'STEEL' | 'EQUIPMENT' | 'MODULE';
export type CargoStatus = 'IN_TRANSIT' | 'RECEIVED' | 'IN_YARD' | 'IN_WAREHOUSE' | 'DISPATCHED' | 'DELIVERED';
export type LocationType = 'YARD' | 'WAREHOUSE' | 'OPEN_AREA' | 'STAGING' | 'BERTH';
export type EquipmentType = 'CRANE' | 'FORKLIFT' | 'SPREADER_BAR' | 'SLING' | 'SHACKLE' | 'BEAM' | 'JACK' | 'ROLLER';
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type MovementType = 'RECEIVE' | 'MOVE' | 'DISPATCH' | 'INSPECT';
export type ProjectStatus = 'PLANNED' | 'RECEIVING' | 'IN_STORAGE' | 'STAGING' | 'LOADED' | 'SHIPPED' | 'COMPLETED';
export type SyncDirection = 'OUTBOUND' | 'INBOUND';
export type SyncStatus = 'PENDING' | 'SENT' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface CargoItem {
  id: string;
  cargoCode: string;
  description: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  volume: number | null;
  liftCategory: LiftCategory;
  centerOfGravity: string | null;
  liftingPoints: number | null;
  specialHandling: string | null;
  hazardClass: string | null;
  commodityType: CommodityType;
  status: CargoStatus;
  locationId: string | null;
  projectId: string | null;
  clientName: string | null;
  poReference: string | null;
  blReference: string | null;
  transportWeight: number | null;
  transportLength: number | null;
  transportWidth: number | null;
  transportHeight: number | null;
  receivedAt: string | null;
  dispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  location?: Location | null;
  project?: Project | null;
  movements?: Movement[];
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  zone: string | null;
  maxWeight: number | null;
  maxDimension: string | null;
  area: number | null;
  isActive: boolean;
  currentLoad: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string | null;
  clientName: string;
  clientContact: string | null;
  destination: string | null;
  shippingLine: string | null;
  vesselName: string | null;
  etd: string | null;
  eta: string | null;
  status: ProjectStatus;
  totalItems: number;
  totalWeight: number;
  totalVolume: number;
  sapProjectId: string | null;
  sapContract: string | null;
  createdAt: string;
  updatedAt: string;
  cargoItems?: CargoItem[];
}

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  type: EquipmentType;
  capacity: number | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  status: EquipmentStatus;
  currentLocation: string | null;
  lastInspection: string | null;
  nextInspection: string | null;
  certificationId: string | null;
  certExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  movementRef: string;
  cargoItemId: string;
  cargoCode: string;
  type: MovementType;
  fromLocationId: string | null;
  toLocationId: string | null;
  equipmentUsed: string | null;
  liftMethod: string | null;
  operatorName: string | null;
  actualWeight: number | null;
  remarks: string | null;
  performedBy: string;
  createdAt: string;
  fromLocation?: Location | null;
  toLocation?: Location | null;
}

export interface DashboardStats {
  totalCargo: number;
  inYard: number;
  inWarehouse: number;
  inTransit: number;
  totalWeight: number;
  totalVolume: number;
  activeProjects: number;
  pendingDispatch: number;
  equipmentAvailable: number;
  movementsToday: number;
  heavyLiftCount: number;
  oversizeCount: number;
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  recentMovements: Movement[];
  projectProgress: { name: string; total: number; received: number; status: string }[];
}

export type WmsPage = 'dashboard' | 'cargo' | 'projects' | 'locations' | 'equipment' | 'movements' | 'integration';
