// Spotify-faithful SVG icons. Filled variants for the active nav state,
// outline for inactive — matching Spotify's own bottom-bar behavior.

type IconProps = { className?: string; filled?: boolean };

export function HomeIcon({ className = "h-6 w-6", filled = false }: IconProps) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 3.3l9 8.1V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.6l9-8.1z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5z" />
    </svg>
  );
}

export function SearchIcon({ className = "h-6 w-6", filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.6 : 2} strokeLinecap="round" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </svg>
  );
}

export function LibraryIcon({ className = "h-6 w-6", filled = false }: IconProps) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 3h3v18H3V3zm5 0h3v18H8V3zm7.2.6l2.9-.8 4.3 15.9-2.9.8L13.2 3.6z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 4v16M9 4v16M14.5 5.2l4 15" />
    </svg>
  );
}

export function CreateIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function PlusIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
    </svg>
  );
}

export function HeartIcon({ className = "h-6 w-6", filled = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s-7.5-4.6-10-9.3C.6 8.5 2 5 5.5 5c2 0 3.4 1.2 4.5 2.6C11.1 6.2 12.5 5 14.5 5 18 5 19.4 8.5 22 11.7 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function CloseIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function InfoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ThumbUpIcon({ className = "h-5 w-5", filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M7 10v10H4V10h3zm3 0l3.2-6.4a2 2 0 0 1 3.8.9V9h3.2a2 2 0 0 1 2 2.3l-1.1 6.5a2 2 0 0 1-2 1.7H10V10z" />
    </svg>
  );
}

export function ThumbDownIcon({ className = "h-5 w-5", filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M17 14V4h3v10h-3zm-3 0l-3.2 6.4a2 2 0 0 1-3.8-.9V15H2.8a2 2 0 0 1-2-2.3l1.1-6.5a2 2 0 0 1 2-1.7H14v10z" />
    </svg>
  );
}

export function RefreshIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3.5V9h-5.5" />
    </svg>
  );
}

export function SpotifyIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <g fill="none" stroke="#000" strokeLinecap="round">
        <path d="M5.8 14.6c3.7-1.3 8.3-1 12 1.3" strokeWidth="1.9" />
        <path d="M6.7 11.4c3.3-1.1 7.6-0.8 10.7 1.1" strokeWidth="1.6" />
        <path d="M7.6 8.4c2.8-0.9 6.4-0.6 9.1 0.9" strokeWidth="1.35" />
      </g>
    </svg>
  );
}

export function SparkleIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9L19 14z" opacity="0.7" />
    </svg>
  );
}
