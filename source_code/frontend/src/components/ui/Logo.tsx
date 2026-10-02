import React, { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);

  const iconDimensions =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const isDarkBg = variant === 'light'; // Text on dark background

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div
        className={`flex ${iconDimensions} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-900/10 bg-amber-900/5 shadow-xs`}
      >
        {!imageError ? (
          <img
            src="/logo-icon.jpg"
            alt="BanquetHub"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-amber-700"
          >
            <circle cx="16" cy="8" r="2" fill="#d97706" />
            <path
              d="M7 21C7 13.5 11 11 16 11C21 11 25 13.5 25 21H7Z"
              fill="currentColor"
              fillOpacity="0.95"
            />
            <rect x="5" y="22.5" width="22" height="2" rx="1" fill="#d97706" />
          </svg>
        )}
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
            className={`text-[9.5px] font-medium tracking-wider mt-1 ${
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


