import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, children, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed', 'top-0', 'z-[100]', 'flex', 'max-h-screen', 'w-full',
      'flex-col-reverse', 'p-4', 'sm:bottom-0', 'sm:right-0', 'sm:top-auto', 'sm:flex-col',
      className
    )}
    {...props}
  >
    {children}
  </ToastPrimitives.Viewport>
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      'group', 'relative', 'flex', 'items-center', 'justify-between',
      'border', 'border-[#111]', 'bg-[#111]', 'p-4', 'text-[#F5F2E9]', 'shadow-sm',
      className
    )}
    {...props}
  >
    <ToastPrimitives.Title className="mb-1 font-medium" />
    <ToastPrimitives.Description />
    <ToastPrimitives.Close
      className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  </ToastPrimitives.Root>
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex', 'h-8', 'items-center', 'justify-center', 'rounded-md',
      'bg-transparent', 'px-3', 'text-sm', 'font-medium', 'ring-offset-background',
      'transition-colors', 'hover:bg-[#F5F2E9]', 'hover:text-[#111]',
      'focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2',
      'disabled:pointer-events-none', 'disabled:opacity-50', className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const toastProvider = ToastProvider;
export const toastViewport = ToastViewport;
export const toast = Toast;
export const toastTitle = ToastTitle;
export const toastDescription = ToastDescription;
export const toastAction = ToastAction;
export const toastClose = ToastPrimitives.Close;
