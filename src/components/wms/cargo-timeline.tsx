'use client';

import { Package, ArrowRightLeft, Truck, ClipboardCheck, MapPin } from 'lucide-react';

interface MovementRecord {
  id: string;
  movementRef: string;
  type: string;
  createdAt: string;
  fromLocation: { name: string; code: string } | null;
  toLocation: { name: string; code: string } | null;
  operatorName: string | null;
  remarks: string | null;
}

interface CargoTimelineProps {
  movements: MovementRecord[];
}

const typeConfig: Record<string, { icon: typeof Package; color: string; bgColor: string; borderColor: string }> = {
  RECEIVE: { icon: Package, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  MOVE: { icon: ArrowRightLeft, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  DISPATCH: { icon: Truck, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  INSPECT: { icon: ClipboardCheck, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
};

const defaultConfig = { icon: MapPin, color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' };

export function CargoTimeline({ movements }: CargoTimelineProps) {
  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500">No movement history</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-700/60" />

      <div className="space-y-4">
        {movements.map((movement, index) => {
          const config = typeConfig[movement.type] || defaultConfig;
          const Icon = config.icon;
          const isLatest = index === 0;

          return (
            <div key={movement.id} className="relative flex gap-4">
              {/* Dot with icon */}
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${config.borderColor} ${config.bgColor} ${isLatest ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-slate-600' : ''}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${config.color}`}>{movement.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{movement.movementRef}</span>
                    {isLatest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Latest</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(movement.createdAt).toLocaleDateString()} {new Date(movement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* From → To */}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  {movement.fromLocation ? (
                    <span className="truncate">{movement.fromLocation.name}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                  <ArrowRightLeft className="h-3 w-3 text-slate-600 shrink-0" />
                  {movement.toLocation ? (
                    <span className="truncate">{movement.toLocation.name}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </div>

                {/* Operator & remarks */}
                {(movement.operatorName || movement.remarks) && (
                  <div className="mt-1 space-y-0.5">
                    {movement.operatorName && (
                      <p className="text-[10px] text-slate-500">Operator: {movement.operatorName}</p>
                    )}
                    {movement.remarks && (
                      <p className="text-[10px] text-slate-500 italic">{movement.remarks}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
