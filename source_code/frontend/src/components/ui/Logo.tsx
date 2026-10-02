import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  to?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  to = '/',
}) => {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9.5 w-9.5';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const isDarkBg = variant === 'light'; // Text on dark background

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Custom Vector Brandmark (Emblem Cloche & Banquet Crest) */}
      <div
        className={`flex ${iconSize} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-white shadow-sm ring-1 ring-amber-900/20`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5.5 w-5.5"
        >
          {/* Top handle dot */}
          <circle cx="16" cy="8" r="2" fill="#FDE68A" />
          {/* Banquet Cloche Dome */}
          <path
            d="M7 21C7 13.5 11 11 16 11C21 11 25 13.5 25 21H7Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          {/* Platter base tray */}
          <rect x="5" y="22.5" width="22" height="2" rx="1" fill="#FDE68A" />
          {/* Subtle accent line on dome */}
          <path
            d="M11 18.5C12.5 15.5 15 14 17 14"
            stroke="#FEF3C7"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Tagline */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight">
          <span
            className={`font-bold ${titleSize} ${
              isDarkBg ? 'text-white' : 'text-stone-900'
            }`}
          >
            Banquet
          </span>
          <span className={`font-extrabold ${titleSize} text-amber-700`}>
            Hub
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[9.5px] font-semibold tracking-[0.16em] uppercase mt-1 ${
              isDarkBg ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            Ẩm thực yến tiệc
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
