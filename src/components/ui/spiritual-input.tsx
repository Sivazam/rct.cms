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
  mantra?: string;
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
  mantra,
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
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={id} 
          className={cn(
            "text-sm font-medium transition-colors",
            isFocused ? "text-orange-600" : "text-gray-700"
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {mantra && (
          <div className="text-xs text-orange-600 italic text-sanskrit">
            {mantra}
          </div>
        )}
      </div>

      <div className="relative">
        {/* Spiritual icon background */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <div className="text-orange-600">
            {getIcon()}
          </div>
        </div>

        {/* Om symbol decoration */}
        <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none opacity-20">
          <div className="text-orange-600 text-lg">ॐ</div>
        </div>

        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={cn(
            "pl-10 pr-12 transition-all duration-200",
            "border-orange-200 focus:border-orange-400 focus:ring-orange-400",
            "bg-orange-50/50 focus:bg-orange-50",
            "placeholder:text-orange-300",
            isFocused && "shadow-lg shadow-orange-100"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Password toggle or Om symbol */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-orange-600 hover:text-orange-700 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : (
            <div className="text-orange-400 text-sm">ॐ</div>
          )}
        </div>
      </div>

      {/* Spiritual quote hint */}
      {isFocused && (
        <div className="text-xs text-orange-600 italic">
          {type === 'email' && '"As you think, so you become" - Bhagavad Gita'}
          {type === 'password' && '"The soul is unborn, eternal, ever-existing" - Bhagavad Gita 2.20'}
          {type === 'text' && '"Speak the truth which is pleasant" - Bhagavad Gita 17.15'}
        </div>
      )}
    </div>
  );
}