import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#333] p-6 rounded-xl shadow-2xl hover:shadow-[0_20px_40px_rgba(0,128,128,0.15)] transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}
