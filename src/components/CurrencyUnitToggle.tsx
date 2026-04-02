'use client';

import type { Currency, WeightUnit } from '@/lib/types';

interface CurrencyUnitToggleProps {
  currency: Currency;
  unit: WeightUnit;
  onCurrencyChange: (c: Currency) => void;
  onUnitChange: (u: WeightUnit) => void;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-slate-800 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === opt.value
              ? 'bg-amber-500 text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function CurrencyUnitToggle({
  currency,
  unit,
  onCurrencyChange,
  onUnitChange,
}: CurrencyUnitToggleProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <ToggleGroup
        options={[
          { value: 'USD' as Currency, label: 'USD' },
          { value: 'CNY' as Currency, label: 'CNY' },
        ]}
        value={currency}
        onChange={onCurrencyChange}
      />
      <ToggleGroup
        options={[
          { value: 'g' as WeightUnit, label: '克' },
          { value: 'kg' as WeightUnit, label: '千克' },
          { value: 'oz' as WeightUnit, label: '盎司' },
        ]}
        value={unit}
        onChange={onUnitChange}
      />
    </div>
  );
}
