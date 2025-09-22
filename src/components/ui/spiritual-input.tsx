'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Lock, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpiritualInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: 'user' | 'mail' | 'phone' | 'location' | 'lock' | 'calendar' | 'package';
  className?: string;
}

export default function SpiritualInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  icon,
  className = ''
}: SpiritualInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getIcon = () => {
    switch (icon) {
      case 'user': return <User className="h-4 w-4" />;
      case 'mail': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'lock': return <Lock className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={id} 
        className={cn(
          "text-sm font-medium transition-colors",
          isFocused ? "text-amber-900" : "text-amber-800"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        {/* Icon background */}
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <div className="text-amber-500">
              {getIcon()}
            </div>
          </div>
        )}

        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={cn(
            icon ? "pl-10" : "pl-3",
            "pr-10 transition-all duration-200",
            "border-amber-200 focus:border-amber-400 focus:ring-amber-400",
            "bg-white focus:bg-white",
            "placeholder:text-amber-300",
            isFocused && "shadow-sm"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Password toggle */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-amber-500 hover:text-amber-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}