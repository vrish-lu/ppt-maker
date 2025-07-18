import React from 'react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  maxLength?: number;
  required?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

const Input = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  className = '',
  type = 'text',
  maxLength,
  required = false,
  onKeyPress,
  style
}: InputProps) => {
  const baseStyles = 'w-full px-4 py-2 border rounded-lg focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const stateStyles = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        className={`${baseStyles} ${stateStyles}`}
        style={style}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {maxLength && (
        <p className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default Input; 