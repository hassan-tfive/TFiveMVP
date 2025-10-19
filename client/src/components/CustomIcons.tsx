import { SVGProps } from 'react';

export function RisingSpiralIcon(props: SVGProps<SVGSVGElement>) {
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
        <linearGradient id="spiralGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#003C51', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#2D9DA8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#E3B34A', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path d="M 256 420 Q 220 400 200 360 Q 180 320 190 280 Q 200 240 230 220 Q 260 200 290 210 Q 320 220 330 250 Q 340 280 325 310 Q 310 340 280 350 Q 250 360 230 345 Q 210 330 210 305 Q 210 280 230 270 Q 250 260 270 270 Q 285 280 285 295" 
        stroke="url(#spiralGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none" 
        filter="url(#glow)"/>
      
      <path d="M 256 370 Q 240 350 235 320 Q 230 290 245 270 Q 260 250 285 255 Q 310 260 320 285 Q 330 310 315 330 Q 300 350 275 350 Q 255 350 245 335 Q 235 320 240 305 Q 245 290 260 290" 
        stroke="url(#spiralGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none" 
        filter="url(#glow)"/>
      
      <path d="M 256 320 Q 245 305 245 285 Q 245 265 260 255 Q 275 245 290 255 Q 305 265 305 280 Q 305 295 295 305 Q 285 315 270 310 Q 260 305 258 295" 
        stroke="url(#spiralGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none" 
        filter="url(#glow)"/>
      
      <path d="M 256 450 Q 180 430 140 360 Q 100 290 110 210 Q 120 130 180 85 Q 240 40 310 60 Q 380 80 410 150 Q 440 220 415 290 Q 390 360 330 395" 
        stroke="url(#spiralGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        strokeDasharray="5,8"
        fill="none" 
        opacity="0.6"/>
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
