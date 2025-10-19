import { SVGProps } from 'react';

export function TairoGlowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="tairoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#E3B34A', stopOpacity: 1 }} />
          <stop offset="70%" style={{ stopColor: '#2D9DA8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#003C51', stopOpacity: 1 }} />
        </radialGradient>
        <filter id="outerGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path d="M 100 350 Q 100 330 120 320 L 190 290 Q 200 285 210 290 L 245 310 Q 255 315 255 325 L 255 380 Q 255 390 245 395 L 120 370 Q 100 365 100 350 Z" 
        fill="#003C51" 
        opacity="0.15"/>
      
      <path d="M 100 350 Q 100 330 120 320 L 190 290 Q 200 285 210 290 L 245 310 Q 255 315 255 325 L 255 360 Q 255 370 245 375 L 120 350 Q 100 345 100 335 Z" 
        stroke="#003C51" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"/>
      
      <circle cx="340" cy="256" r="95" 
        fill="url(#tairoGlow)" 
        filter="url(#outerGlow)" 
        opacity="0.3"/>
      
      <circle cx="340" cy="256" r="70" 
        stroke="#2D9DA8" 
        strokeWidth="3" 
        fill="none" 
        opacity="0.6"/>
      
      <circle cx="340" cy="256" r="50" 
        stroke="#E3B34A" 
        strokeWidth="2.5" 
        fill="none"/>
      
      <circle cx="340" cy="256" r="12" 
        fill="#E3B34A"/>
      
      <path d="M 310 240 Q 315 235 325 235" 
        stroke="#E3B34A" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.7"/>
      <path d="M 350 235 Q 360 235 365 240" 
        stroke="#E3B34A" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.7"/>
      <path d="M 310 272 Q 315 277 325 277" 
        stroke="#E3B34A" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.7"/>
      <path d="M 350 277 Q 360 277 365 272" 
        stroke="#E3B34A" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.7"/>
    </svg>
  );
}

export function GrowthStepsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="stepsGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#003C51', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#2D9DA8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#E3B34A', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="stepGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect x="90" y="360" width="90" height="70" rx="8" 
        fill="#003C51" 
        opacity="0.3"/>
      <rect x="90" y="360" width="90" height="70" rx="8" 
        stroke="#003C51" 
        strokeWidth="3" 
        fill="none"/>
      
      <rect x="210" y="280" width="90" height="150" rx="8" 
        fill="#2D9DA8" 
        opacity="0.3"/>
      <rect x="210" y="280" width="90" height="150" rx="8" 
        stroke="#2D9DA8" 
        strokeWidth="3" 
        fill="none"/>
      
      <rect x="330" y="190" width="90" height="240" rx="8" 
        fill="#E3B34A" 
        opacity="0.3"/>
      <rect x="330" y="190" width="90" height="240" rx="8" 
        stroke="#E3B34A" 
        strokeWidth="3" 
        fill="none"/>
      
      <circle cx="135" cy="380" r="8" fill="#003C51" filter="url(#stepGlow)"/>
      <circle cx="255" cy="310" r="8" fill="#2D9DA8" filter="url(#stepGlow)"/>
      <circle cx="375" cy="230" r="10" fill="#E3B34A" filter="url(#stepGlow)"/>
      
      <path d="M 180 380 L 210 320" 
        stroke="url(#stepsGradient)" 
        strokeWidth="2.5" 
        strokeDasharray="8,6" 
        strokeLinecap="round" 
        opacity="0.6"/>
      <path d="M 300 310 L 330 240" 
        stroke="url(#stepsGradient)" 
        strokeWidth="2.5" 
        strokeDasharray="8,6" 
        strokeLinecap="round" 
        opacity="0.6"/>
      
      <polygon points="375,140 390,170 360,170" 
        fill="#E3B34A" 
        filter="url(#stepGlow)"/>
      <path d="M 375 170 L 375 190" 
        stroke="#E3B34A" 
        strokeWidth="2.5" 
        strokeLinecap="round"/>
    </svg>
  );
}

export function FingerprintLinesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="fingerprintGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#E3B34A', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#2D9DA8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#003C51', stopOpacity: 1 }} />
        </radialGradient>
        <filter id="innerGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="256" cy="256" r="20" fill="#E3B34A" opacity="0.8" filter="url(#innerGlow)"/>
      
      <path d="M 256 196 Q 286 196 306 216 Q 326 236 326 266 Q 326 296 306 316 Q 286 336 256 336 Q 226 336 206 316 Q 186 296 186 266 Q 186 236 206 216 Q 226 196 256 196" 
        stroke="#E3B34A" 
        strokeWidth="3" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.9"/>
      
      <path d="M 256 166 A 90 90 0 0 1 346 256" 
        stroke="#2D9DA8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        fill="none"/>
      <path d="M 346 256 A 90 90 0 0 1 256 346" 
        stroke="#2D9DA8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.8"/>
      <path d="M 256 346 A 90 90 0 0 1 166 256" 
        stroke="#2D9DA8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        fill="none"/>
      <path d="M 166 256 A 90 90 0 0 1 206 186" 
        stroke="#2D9DA8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.8"/>
      
      <path d="M 256 126 A 130 130 0 0 1 386 256" 
        stroke="#003C51" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        fill="none"/>
      <path d="M 386 256 A 130 130 0 0 1 326 356" 
        stroke="#003C51" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.7"/>
      <path d="M 276 386 A 130 130 0 0 1 126 256" 
        stroke="#003C51" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        fill="none"/>
      <path d="M 126 256 A 130 130 0 0 1 186 156" 
        stroke="#003C51" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.7"/>
      
      <path d="M 256 86 A 170 170 0 0 1 426 256" 
        stroke="#003C51" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeDasharray="15,10"
        fill="none" 
        opacity="0.5"/>
      <path d="M 256 426 A 170 170 0 0 1 86 256" 
        stroke="#003C51" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeDasharray="15,10"
        fill="none" 
        opacity="0.5"/>
    </svg>
  );
}

export function EyeFrameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="irisGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#E3B34A', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#D4A03A', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="eyeGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path d="M 256 96 L 386 166 L 386 346 L 256 416 L 126 346 L 126 166 Z" 
        stroke="#003C51" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"/>
      
      <path d="M 256 116 L 366 176 L 366 336 L 256 396 L 146 336 L 146 176 Z" 
        stroke="#003C51" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" 
        opacity="0.3"/>
      
      <path d="M 166 256 Q 166 226 196 216 Q 226 206 256 206 Q 286 206 316 216 Q 346 226 346 256 Q 346 286 316 296 Q 286 306 256 306 Q 226 306 196 296 Q 166 286 166 256" 
        stroke="#003C51" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        fill="none"/>
      
      <circle cx="256" cy="256" r="32" 
              fill="url(#irisGradient)" 
              filter="url(#eyeGlow)"/>
      
      <circle cx="256" cy="256" r="16" 
              fill="#003C51"/>
      
      <circle cx="264" cy="246" r="6" 
              fill="#2D9DA8" 
              opacity="0.8"/>
      <circle cx="268" cy="252" r="3" 
              fill="#2D9DA8" 
              opacity="0.6"/>
      
      <path d="M 176 246 Q 216 226 256 226 Q 296 226 336 246" 
        stroke="#003C51" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.6"/>
      
      <path d="M 176 266 Q 216 286 256 286 Q 296 286 336 266" 
        stroke="#003C51" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        fill="none" 
        opacity="0.6"/>
      
      <circle cx="166" cy="256" r="4" fill="#2D9DA8" opacity="0.5"/>
      <circle cx="346" cy="256" r="4" fill="#2D9DA8" opacity="0.5"/>
    </svg>
  );
}
