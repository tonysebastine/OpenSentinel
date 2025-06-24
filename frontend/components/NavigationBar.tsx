
import React from 'react';
import { ShieldIcon, PlusCircleIcon, SunIcon, MoonIcon, CogIcon, HomeIcon, ListBulletIcon } from './icons';
import { Theme, AppView } from '../types';

interface NavigationBarProps {
  onOpenNewScanModal: () => void;
  currentTheme: Theme;
  onToggleTheme: () => void;
  onOpenSettingsModal: () => void;
  currentView: AppView;
  onSetCurrentView: (view: AppView) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  onOpenNewScanModal, 
  currentTheme, 
  onToggleTheme,
  onOpenSettingsModal,
  currentView,
  onSetCurrentView
}) => {
  const NavLink: React.FC<{
    view: AppView;
    current: AppView;
    setView: (view: AppView) => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
    title?: string;
  }> = ({ view, current, setView, icon, children, title }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
        ${current === view 
          ? 'bg-teal-100 dark:bg-teal-700/60 text-teal-700 dark:text-teal-300' 
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
        }`}
      aria-current={current === view ? 'page' : undefined}
      title={title || (typeof children === 'string' ? children : undefined)}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  return (
    <nav className="bg-slate-200 dark:bg-slate-800 p-4 shadow-md sticky top-0 z-50 transition-colors duration-300 border-b border-slate-300 dark:border-slate-700">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldIcon className="h-8 w-8 text-teal-600 dark:text-teal-500 flex-shrink-0" />
          <div className='hidden md:flex items-center space-x-2'>
            <NavLink view="overview" current={currentView} setView={onSetCurrentView} icon={<HomeIcon className="h-5 w-5" />} title="Dashboard Overview">
                Overview
            </NavLink>
             <NavLink view="dashboard" current={currentView} setView={onSetCurrentView} icon={<ListBulletIcon className="h-5 w-5" />} title="Scan Management">
                Scan Management
            </NavLink>
          </div>
           <div className="md:hidden text-lg font-bold text-slate-800 dark:text-slate-100">
            {currentView === 'overview' ? 'Overview' : 'Scan Management'}
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Mobile navigation trigger - if more links were needed */}
          {/* <button className="md:hidden p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button> */}
          
          <button
            onClick={onOpenNewScanModal}
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition-colors duration-150 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-200 dark:focus:ring-offset-slate-800 focus:ring-teal-500"
            aria-haspopup="dialog"
            title="Start a new scan"
          >
            <PlusCircleIcon className="h-5 w-5 sm:mr-1.5" />
            <span className="hidden sm:inline">New Scan</span>
          </button>
          
           <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors duration-150"
            aria-label={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {currentTheme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors duration-150"
            aria-label="Open settings"
            title="Settings"
          >
            <CogIcon className="h-5 w-5" />
          </button>
           <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Conceptual: Link to API Documentation (e.g., Swagger UI)"); }}
            className="hidden sm:inline-block text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150 text-sm font-medium px-1 sm:px-2 py-2"
            title="API Documentation"
          >
            API Docs
          </a>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
