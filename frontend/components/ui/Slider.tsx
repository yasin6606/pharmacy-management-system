'use client';

type SliderProps = {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
    'aria-label'?: string;
};

/** Accessible range input used by settings-style forms */
export function Slider({
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    className,
    'aria-label': ariaLabel = 'Slider',
}: SliderProps) {
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={ariaLabel}
            className={className}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    );
}
