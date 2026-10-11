import React from 'react';
import { Appointment } from '../types/index.ts';
import {
  Ticket,
  Clock,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';

interface QueueTokenCardProps {
  appointment: Appointment;
  onCancel?: (appointment: Appointment) => void;
  isCancelling?: boolean;
}

export const QueueTokenCard: React.FC<QueueTokenCardProps> = ({
  appointment,
  onCancel,
  isCancelling = false,
}) => {
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'in_consultation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            In Consultation
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Cancelled (Slot Released)
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Waiting in Queue
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Top Banner with Token & Status */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
            Queue Token
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white block mt-0.5">
            {appointment.queueToken}
          </span>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <span>Position: #{appointment.queueNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Est. Wait: ~{appointment.estimatedWaitMinutes} mins</span>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Body Details */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 text-xs text-slate-600">
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <img
            src={appointment.doctorAvatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&auto=format&fit=crop&q=80'}
            alt={appointment.doctorName}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{appointment.doctorName}</h4>
            <p className="text-xs font-semibold text-teal-700">{appointment.specialty}</p>
            {appointment.hospitalAffiliation && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                {appointment.hospitalAffiliation}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
            <span className="font-semibold text-slate-800">{appointment.date}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot Time</span>
            <span className="font-semibold text-slate-800">{appointment.timeSlot}</span>
          </div>
        </div>

        {appointment.notes && (
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700">Notes:</span> {appointment.notes}
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500">Fee Payable:</span>
          <span className="font-bold text-slate-900">
            {appointment.finalFee === 0 ? (
              <span className="text-emerald-700 font-extrabold">FREE (₹0)</span>
            ) : (
              <>
                ₹{appointment.finalFee}
                {appointment.discountAmount > 0 && (
                  <span className="text-slate-400 text-[10px] line-through ml-1">
                    ₹{appointment.originalFee}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      {appointment.status === 'waiting' && onCancel && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => onCancel(appointment)}
            disabled={isCancelling}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-100/80 border border-rose-200 transition-colors"
          >
            {isCancelling ? 'Releasing Slot...' : 'Cancel Appointment'}
          </button>
        </div>
      )}
    </div>
  );
};
