
import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircleIcon, AlertTriangleIcon, InformationCircleIcon, XMarkIcon } from './icons';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />;
      case 'error':
        return <AlertTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  const getBorderColor = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500 dark:border-green-400';
      case 'error':
        return 'border-red-500 dark:border-red-400';
      case 'info':
        return 'border-blue-500 dark:border-blue-400';
      default:
        return 'border-slate-500 dark:border-slate-400';
    }
  };


  return (
    <div 
      aria-live="assertive" 
      className="fixed inset-0 flex flex-col items-end justify-start px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-start z-[100]" // High z-index
    >
      <div className="w-full max-w-sm space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg 
              bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 
              border-l-4 ${getBorderColor(toast.type)}
              transition-all duration-300 ease-out
              translate-x-0 opacity-100 // Implement enter/leave animations if desired
            `}
            role="alert"
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(toast.type)}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
