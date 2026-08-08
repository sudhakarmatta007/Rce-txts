import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center bg-slate-900 rounded-xl shadow-md shadow-slate-900/10 overflow-hidden ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg 
        width={Math.round(size * 0.7)} 
        height={Math.round(size * 0.7)} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fluid handwriting cursive flourish morphing into structured digital text */}
        <path 
          d="M7 21C7 21 8.5 14 11.5 14C14 14 15 17.5 15 19.5C15 22 13.5 23.5 11.8 23.5C10 23.5 9 22 10.2 18L13 9.5" 
          stroke="url(#brand_logo_grad)" 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Digital Text Bar */}
        <path 
          d="M19 11.5H25M22 11.5V23.5M19.5 23.5H24.5" 
          stroke="#818CF8" 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* AI Spark Node */}
        <circle cx="22" cy="7.2" r="1.6" fill="#38BDF8" />

        <defs>
          <linearGradient id="brand_logo_grad" x1="7" y1="9.5" x2="15" y2="23.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C084FC" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
