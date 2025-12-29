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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md border border-border">
        <button
          type="button"
          onClick={handleSwatchClick}
          className={cn(
            'w-8 h-8 rounded-md border border-border cursor-pointer',
            'hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-all'
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
            'flex-1 bg-transparent text-sm font-mono text-foreground',
            'focus:outline-none uppercase'
          )}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
};
