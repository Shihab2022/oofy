import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, children }: { className?: string; children: React.ReactChild }) => (
  <div className={cn('rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 p-6', className)}>{children}</div>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, children }: { className?: string; children: React.ReactChild }) => (
  <div className={cn('pb-2', className)}>{children}</div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, children }: { className?: string; children: React.ReactChild }) => (
  <h3 className={cn('text-lg font-black uppercase', className)}>{children}</h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, children }: { className?: string; children: React.ReactChild }) => (
  <p className={cn('text-sm text-[#111]/70', className)}>{children}</p>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, children }: { className?: string; children: React.ReactChild }) => (
  <div className={cn('p-4', className)}>{children}</div>
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
