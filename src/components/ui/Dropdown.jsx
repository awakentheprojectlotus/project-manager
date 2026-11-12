import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useClickOutside } from '../../hooks/useClickOutside';

export default function Dropdown({ trigger, items, align = 'right', className, buttonClassName, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={buttonClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            'absolute top-full z-40 mt-1.5 w-52 animate-scale-in overflow-hidden rounded-xl border border-edge bg-elevated p-1 shadow-pop',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          )}
        >
          {items.map((item, index) =>
            item.separator ? (
              <div key={`sep-${index}`} className="my-1 h-px bg-edge" />
            ) : (
              <button
                key={item.label || index}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition disabled:opacity-50',
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                    : 'text-ink hover:bg-canvas'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-70" />}
                <span className="truncate">{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
