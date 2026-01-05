import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TargetLengthControlProps {
  value: number;
  onChange: (value: number) => void;
  onAdjust: (multiplier: number) => void;
  disabled?: boolean;
}

export const TargetLengthControl = ({
  value,
  onChange,
  onAdjust,
  disabled = false,
}: TargetLengthControlProps) => {
  // Local state for input field (allows typing before blur saves)
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync with external value
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing any numbers
    const val = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(val);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      // Reset to current value if invalid
      setInputValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleShorter = () => {
    onAdjust(0.75); // -25%
  };

  const handleLonger = () => {
    onAdjust(1.25); // +25%
  };

  // Refined 3D button styles with subtle primary accent
  const buttonClasses = `
    flex flex-col items-center justify-center w-[52px] h-[42px] rounded-xl
    bg-gradient-to-b from-white to-slate-50
    dark:from-slate-700 dark:to-slate-800
    border border-slate-200 dark:border-slate-600
    shadow-[0_1px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]
    dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
    hover:border-primary/30 hover:bg-gradient-to-b hover:from-primary/5 hover:to-white
    hover:shadow-[0_2px_8px_rgba(124,33,204,0.1),inset_0_1px_0_rgba(255,255,255,0.95)]
    dark:hover:from-slate-600 dark:hover:to-slate-700
    active:bg-gradient-to-b active:from-slate-100 active:to-slate-50
    active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]
    dark:active:from-slate-750 dark:active:to-slate-800
    transition-all duration-150 ease-out
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]
    group
  `;

  return (
    <div className="flex items-start gap-1.5">
      {/* Shorter Button - Compact 3D */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleShorter}
            disabled={disabled || value <= 50}
            className={buttonClasses}
          >
            <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-primary/70 transition-colors" strokeWidth={2.5} />
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary/70 mt-0.5 uppercase tracking-wide leading-none transition-colors">Shorter</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Reduce by 25%</TooltipContent>
      </Tooltip>

      {/* Target Value - Compact stacked */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide font-medium leading-none mb-0.5">Target</span>
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-[26px] w-14 text-xs text-center tabular-nums font-semibold px-1 border-slate-200 focus:border-primary/40 focus:ring-primary/20"
        />
        <span className="text-[9px] text-muted-foreground/70 font-medium leading-none mt-0.5">words</span>
      </div>

      {/* Longer Button - Compact 3D */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleLonger}
            disabled={disabled || value >= 5000}
            className={buttonClasses}
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-primary/70 transition-colors" strokeWidth={2.5} />
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary/70 mt-0.5 uppercase tracking-wide leading-none transition-colors">Longer</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Increase by 25%</TooltipContent>
      </Tooltip>
    </div>
  );
};
