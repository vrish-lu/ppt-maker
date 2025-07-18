import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  style?: React.CSSProperties;
}

const Card = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
  style
}: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <div 
      className={`
        bg-white rounded-xl border border-gray-200 
        ${paddingStyles[padding]} 
        ${shadowStyles[shadow]} 
        ${hoverStyles}
        transition-all duration-200
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card; 