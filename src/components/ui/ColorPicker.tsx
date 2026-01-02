import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const [inputValue, setInputValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSwatchClick = () => {
    colorInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 p-1.5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
        <button
          type="button"
          onClick={handleSwatchClick}
          className={cn(
            'w-7 h-7 rounded-md border border-border/50 cursor-pointer shadow-sm',
            'hover:scale-105 hover:shadow-md transition-all duration-200'
          )}
          style={{ backgroundColor: value }}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={handleColorChange}
          className="sr-only"
        />
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
