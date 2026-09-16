"use client";
import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;
    const timeout = setTimeout(() => {
      onChangeRef.current(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, initialValue]);

  return (
    <Input 
      {...props} 
      value={value} 
      onChange={e => setValue(e.target.value)} 
    />
  );
}
