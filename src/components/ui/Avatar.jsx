import clsx from 'clsx';
import { AVATAR_PALETTE } from '../../constants';
import { initials } from '../../utils/helpers';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-lg',
};

const colorFor = (member, colorIndex) => {
  if (Number.isInteger(member?.avatarColor)) return AVATAR_PALETTE[member.avatarColor % AVATAR_PALETTE.length];
  if (Number.isInteger(colorIndex)) return AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];
  const name = member?.name || '';
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

export default function Avatar({ member, name, size = 'md', className, showStatus = false, title }) {
  const label = name || member?.name || 'User';
  const palette = colorFor(member);
  return (
    <span className={clsx('relative inline-flex shrink-0', className)}>
      <span
        title={title || label}
        className={clsx(
          'inline-flex select-none items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]',
          SIZES[size] || SIZES.md,
          palette.bg,
          palette.text
        )}
      >
        {initials(label)}
      </span>
      {showStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface',
            member?.status === 'away' ? 'bg-amber-400' : 'bg-emerald-500'
          )}
        />
      )}
    </span>
  );
}

export function AvatarGroup({ members = [], max = 4, size = 'sm' }) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((member) => (
        <Avatar
          key={member.id}
          member={member}
          size={size}
          className="ring-0"
          title={member.name}
        />
      ))}
      {extra > 0 && (
        <span
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-elevated font-semibold text-muted ring-0',
            SIZES[size]
          )}
          title={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
