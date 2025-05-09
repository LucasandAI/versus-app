
import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size];

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader className={cn('animate-spin text-primary', sizeClass)} />
    </div>
  );
};

export default Spinner;
