import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase();

    // Auto-prepend # if user starts typing without it
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }

    setInputValue(newValue);

    // Validate hex color (3 or 6 digits)
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    } else if (/^#[0-9A-Fa-f]{3}$/.test(newValue)) {
      // Expand 3-digit hex to 6-digit
      const expanded = '#' + newValue[1] + newValue[1] + newValue[2] + newValue[2] + newValue[3] + newValue[3];
      onChange(expanded.toUpperCase());
    }
  };

  const handlePickerChange = (newColor: string) => {
    const upperColor = newColor.toUpperCase();
    setInputValue(upperColor);
    onChange(upperColor);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 p-1.5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-7 h-7 rounded-md border border-border/50 cursor-pointer shadow-sm',
                'hover:scale-105 hover:shadow-md transition-all duration-200'
              )}
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker color={value} onChange={handlePickerChange} />
          </PopoverContent>
        </Popover>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-xs font-mono text-foreground',
            'focus:outline-none uppercase'
          )}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
};
