
import * as React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

export function DebouncedInput({ 
  value: initialValue, 
  onChange, 
  debounce = 300, 
  ...props 
}: { 
  value: string | number; 
  onChange: (value: string | number) => void; 
  debounce?: number; 
} & Omit<React.ComponentProps<typeof Input>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  return (
    <Input {...props} value={value} onChange={e => setValue(e.target.value)} />
  );
}
