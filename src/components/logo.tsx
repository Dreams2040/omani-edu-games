// A small dhow sail on a turquoise tile: the brand mark.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--sea)" />
      <path d="M21 8 L21 27 L31 27 Z" fill="var(--saffron)" />
      <path d="M19 12 L19 27 L11 27 Z" fill="#fff" />
      <path d="M8 29 H32 L28 33 H12 Z" fill="var(--pomegranate)" />
    </svg>
  );
}
