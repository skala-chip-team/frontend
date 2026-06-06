import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type InputBoxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
};

export default function InputBox({
  label,
  icon: Icon,
  className = '',
  ...inputProps
}: InputBoxProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 transition duration-200 focus-within:border-primary-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-500/10">
        <Icon className="h-4 w-4 text-gray-400" />

        <input
          className={`h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 ${className}`}
          {...inputProps}
        />
      </div>
    </div>
  );
}
