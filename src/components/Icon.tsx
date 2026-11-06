import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><circle cx="17" cy="9" r="2.8" /><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5.4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5" /></>,
  chat: <path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H8.5L4 20.5Z" />,
  chatRound: <path d="M12 3.5c5 0 9 3.4 9 7.8s-4 7.8-9 7.8c-1.2 0-2.3-.2-3.4-.5L3.5 20.5l1.6-4.1C3.8 15 3 13.2 3 11.3 3 6.9 7 3.5 12 3.5Z" />,
  book: <><path d="M12 6.5c-2-1.6-4.8-2.2-8.5-2v14c3.7-.2 6.5.4 8.5 2 2-1.6 4.8-2.2 8.5-2v-14c-3.7-.2-6.5.4-8.5 2Z" /><path d="M12 6.5v14" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6Z" /><path d="m8.8 12 2.3 2.3 4.3-4.6" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8Z" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  arrowRight: <><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></>,
  arrowLeft: <><path d="M19.5 12h-15" /><path d="m10.5 6-6 6 6 6" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" /></>,
  coins: <><ellipse cx="9" cy="6.5" rx="5.5" ry="2.5" /><path d="M3.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" /><path d="M3.5 10.5v4c0 1.4 2.5 2.5 5.5 2.5 1 0 1.9-.1 2.7-.3" /><ellipse cx="15.5" cy="14" rx="5" ry="2.3" /><path d="M10.5 14v3.8c0 1.3 2.2 2.3 5 2.3s5-1 5-2.3V14" /></>,
  laptop: <><rect x="4" y="5" width="16" height="10.5" rx="1.5" /><path d="M2 19h20" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.7 2.7L16.5 9" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  rocket: <><path d="M13.5 4.5c3-1.3 5.5-1 6-.5s.8 3-.5 6l-5.5 5.5-5-5Z" /><path d="M8.5 10.5 5 10l-2 2 4 1M13.5 15.5l.5 3.5-2 2-1-4M5.5 18.5l2-2" /><circle cx="15.5" cy="8.5" r="1.3" /></>,
  bolt: <path d="M13.5 2.5 4.5 13.5h6.5l-1 8 9-11h-6.5Z" />,
  bookmark: <path d="M6.5 4h11v16.5l-5.5-4-5.5 4Z" />,
  refresh: <><path d="M20 11.5A8 8 0 0 0 6 6.3L4 8.5" /><path d="M4 4v4.5h4.5M4 12.5A8 8 0 0 0 18 17.7l2-2.2" /><path d="M20 20v-4.5h-4.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>,
  play: <path d="m8 5.5 11 6.5-11 6.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  plane: <path d="M21 4.5 3.5 11l6 2.5 2.5 6 3.5-5 4 3Z" />,
  layers: <><path d="m12 3.5 9 4.5-9 4.5L3 8Z" /><path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4.5h11l-2 4 2 4H5" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  euro: <><path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5" /><path d="M4 10.5h9M4 13.5h9" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  fire: <path d="M12 21c-3.9 0-7-2.8-7-6.6 0-4.7 4.5-6.6 4.5-11.4 3.3 1.8 6 5 6.2 8.4.9-.8 1.5-1.9 1.6-3.2 1.7 1.7 2.7 3.9 2.7 6.2 0 3.8-3.1 6.6-8 6.6Z" />,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const filled = rest.fill && rest.fill !== "none";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest} style={filled ? { ...rest.style } : rest.style}>
      {P[name]}
    </svg>
  );
}

export function VerifiedBadge({ size = 16, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={title} role="img" className="inline-block flex-none">
      <title>{title}</title>
      <path fill="#e8641c" d="M12 1.8 14.6 4l3.4-.3.9 3.3 3 1.7-1.3 3.2 1.3 3.2-3 1.7-.9 3.3-3.4-.3L12 22.2 9.4 20l-3.4.3-.9-3.3-3-1.7L3.4 12 2.1 8.8l3-1.7.9-3.3 3.4.3Z" />
      <path d="m8 12.3 2.6 2.6L16 9.6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
