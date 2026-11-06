export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size * 1.45} height={size} viewBox="0 0 64 44" aria-hidden="true">
      {/* teal speech bubble */}
      <path d="M22 4C11 4 3 11 3 20c0 5 2.4 9.3 6.3 12.2L7 40l9.2-4.4c1.8.5 3.8.8 5.8.8 11 0 19-7.2 19-16.2S33 4 22 4Z" fill="#124c49" />
      {/* orange bubble with compass */}
      <path d="M42 6c-9.4 0-17 6.8-17 15.2 0 8.4 7.6 15.2 17 15.2 1.7 0 3.3-.2 4.8-.6L56 40l-2.3-7.2C57.6 30 60 25.9 60 21.2 60 12.8 51.4 6 42 6Z" fill="#e8641c" />
      <circle cx="42.5" cy="21.2" r="9" fill="none" stroke="#fff" strokeWidth="2.2" />
      <path d="m47.5 15.8-3.4 7-6.6 3.8 3.4-7Z" fill="#fff" />
      <circle cx="42.5" cy="21.2" r="1.4" fill="#e8641c" />
    </svg>
  );
}

export function Logo({ tagline = true }: { tagline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[27px] text-teal-900 tracking-tight">AskARoamer</span>
        {tagline && (
          <span className="relative mt-1 text-[8.5px] font-semibold tracking-[0.28em] text-teal-900 uppercase">
            Know before you go.
            <svg className="absolute -bottom-2 left-[42%]" width="46" height="6" viewBox="0 0 46 6" aria-hidden="true"><path d="M1 4.5C14 1 30 1 45 3" stroke="#e8641c" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
          </span>
        )}
      </span>
    </span>
  );
}
