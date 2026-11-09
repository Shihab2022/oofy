import * as React from 'react';
import { toastProvider as ToastProvider, toastViewport as ToastViewport } from './toast';

export function ToastRoot() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
