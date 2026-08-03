// components/ui/Switch.tsx
'use client';
import {Switch as HeadlessSwitch} from '@headlessui/react';
import {cn} from '@/lib/utils';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export function Switch({checked, onChange, className}: SwitchProps) {
    return (
        <HeadlessSwitch
            checked={checked}
            onChange={onChange}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                checked ? 'bg-primary' : 'bg-muted',
                className
            )}
        >
      <span
          className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              checked ? 'translate-x-6' : 'translate-x-1'
          )}
      />
        </HeadlessSwitch>
    );
}
