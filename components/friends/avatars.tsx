import { cn } from "@/lib/utils";

export function FriendAvatar({
  friend,
  className,
}: {
  friend: Friend;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] text-sm font-medium", friend.color, className)}>
      <span aria-hidden="true">{friend.initials}</span>
      <span className="sr-only">{friend.name}</span>
      {friend.online && (
        <span aria-label="В сети" className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-[3px] border-zinc-950 bg-emerald-400" />
      )}
    </span>
  );
}
