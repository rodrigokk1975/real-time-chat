const AVATAR_PALETTE = [
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  "bg-sky-500/15 text-sky-300 border-sky-500/25",
  "bg-amber-500/15 text-amber-300 border-amber-500/25",
  "bg-rose-500/15 text-rose-300 border-rose-500/25",
  "bg-violet-500/15 text-violet-300 border-violet-500/25",
  "bg-teal-500/15 text-teal-300 border-teal-500/25",
] as const;

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
