import React from 'react';

interface LogoProps {
  variant?: 'navbar' | 'auth' | 'large' | 'compact' | 'footer';
  className?: string;
  onClick?: () => void;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'navbar',
  className = '',
  onClick,
  showTagline = true,
}) => {
  const isAuthOrLarge = variant === 'auth' || variant === 'large';
  const isCompact = variant === 'compact';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center gap-3 select-none text-left transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-lg' : ''
      } ${className}`}
      aria-label="QueueCare – Patient Appointment and Queue Management System: Less Wait, More Care"
    >
      {/* Dynamic Emblem with blue-to-teal gradient, medical cross and queue pulse */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-500 shadow-md shadow-teal-700/10 shrink-0 ${
          isAuthOrLarge ? 'w-13 h-13 rounded-2xl' : isCompact ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-xl'
        }`}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-white/10 pointer-events-none" />

        {/* Medical Cross & Pulse Wave Icon */}
        <svg
          viewBox="0 0 32 32"
          className={isAuthOrLarge ? 'w-7 h-7 text-white' : isCompact ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Vertical stem */}
          <rect x="13.5" y="7" width="5" height="18" rx="2.5" fill="white" stroke="none" />
          {/* Horizontal stem */}
          <rect x="7" y="13.5" width="18" height="5" rx="2.5" fill="white" stroke="none" />
          {/* Vital pulse queue dot */}
          <circle cx="23" cy="9" r="2" fill="#bae6fd" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-extrabold tracking-tight text-slate-900 ${
              isAuthOrLarge
                ? 'text-3xl'
                : isCompact
                ? 'text-lg'
                : 'text-xl'
            }`}
          >
            Queue
            <span className="text-teal-600 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Care
            </span>
          </span>
        </div>

        {showTagline && !isCompact && (
          <span
            className={`font-semibold tracking-wider uppercase text-slate-500 mt-1 flex items-center gap-1 ${
              isAuthOrLarge ? 'text-xs' : 'text-[10px]'
            }`}
          >
            <span>Less Wait</span>
            <span className="text-teal-600 font-bold">·</span>
            <span className="text-slate-600">More Care</span>
          </span>
        )}
      </div>
    </div>
  );
};
