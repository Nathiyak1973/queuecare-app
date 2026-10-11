import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SlotLegendProps {
  className?: string;
  compact?: boolean;
}

export const SlotLegend: React.FC<SlotLegendProps> = ({ className = '', compact = false }) => {
  return (
    <div
      className={`flex items-center gap-4 p-2.5 rounded-lg border border-slate-200 bg-white shadow-xs ${className}`}
      role="region"
      aria-label="Appointment Slot Availability Legend"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
        Slot Legend:
      </div>

      {/* GREEN - Available */}
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600 inline-flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
        </span>
        <span className="text-xs font-medium text-emerald-800">
          Green = Available
        </span>
      </div>

      <span className="text-slate-300" aria-hidden="true">|</span>

      {/* RED - Booked / Unavailable */}
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600 inline-flex items-center justify-center shadow-xs">
          <XCircle className="w-2.5 h-2.5 text-white" />
        </span>
        <span className="text-xs font-medium text-rose-800">
          Red = Booked / Unavailable
        </span>
      </div>
    </div>
  );
};
