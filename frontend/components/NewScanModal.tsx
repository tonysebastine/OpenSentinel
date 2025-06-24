
import React, { useState, useEffect, useRef } from 'react';
import { AvailableScanTools, ScanProfile } from '../types';
import { SCAN_TOOLS_CONFIG, SCAN_PROFILES_CONFIG } from '../constants';

interface NewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (targetUrl: string, selectedTools: AvailableScanTools[]) => void;
  enabledToolsFromSettings: Record<AvailableScanTools, boolean>;
}

const NewScanModal: React.FC<NewScanModalProps> = ({ isOpen, onClose, onStartScan, enabledToolsFromSettings }) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ScanProfile>(ScanProfile.QUICK);
  
  const getInitialToolsForProfile = (profile: ScanProfile): AvailableScanTools[] => {
    if (profile === ScanProfile.CUSTOM) return []; // Custom starts empty or retains user selection
    const profileTools = SCAN_PROFILES_CONFIG[profile as Exclude<ScanProfile, ScanProfile.CUSTOM>] || [];
    return profileTools.filter(tool => enabledToolsFromSettings[tool]);
  };
  
  const [selectedTools, setSelectedTools] = useState<AvailableScanTools[]>(getInitialToolsForProfile(ScanProfile.QUICK));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const availableToolsConfig = SCAN_TOOLS_CONFIG.filter(toolConfig => enabledToolsFromSettings[toolConfig.id]);

  useEffect(() => {
    if (isOpen) {
      setTargetUrl('');
      const initialProfile = ScanProfile.QUICK;
      setSelectedProfile(initialProfile);
      setSelectedTools(getInitialToolsForProfile(initialProfile));
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 0);

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose, enabledToolsFromSettings]); // Re-evaluate initial tools if enabledToolsFromSettings changes

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleProfileChange = (profile: ScanProfile) => {
    setSelectedProfile(profile);
    if (profile !== ScanProfile.CUSTOM) {
      setSelectedTools(getInitialToolsForProfile(profile));
    } else {
      // When switching to custom, retain currently selected tools if any, or start empty
      // setSelectedTools([]); // Or retain current selection based on preference
    }
  };

  const handleToolToggle = (tool: AvailableScanTools) => {
    if (selectedProfile !== ScanProfile.CUSTOM) {
        setSelectedProfile(ScanProfile.CUSTOM); // Switch to custom if a tool is manually toggled
    }
    setSelectedTools(prev => 
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      setError('Target URL cannot be empty.');
      inputRef.current?.focus();
      return;
    }
    try {
      let urlToTest = targetUrl;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.match(/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/) || targetUrl.includes('localhost')) {
            urlToTest = `http://${targetUrl}`;
        } else {
            urlToTest = `https://${targetUrl}`;
        }
      }
      new URL(urlToTest);
    } catch (_) {
      setError('Please enter a valid URL (e.g., example.com or http://localhost:3000).');
      inputRef.current?.focus();
      return;
    }
    if (selectedTools.length === 0) {
      setError('Please select at least one scan tool.');
      return;
    }
    setError(null);
    let finalTargetUrl = targetUrl;
    if (!finalTargetUrl.startsWith('http://') && !finalTargetUrl.startsWith('https://')) {
        if (finalTargetUrl.match(/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/) || finalTargetUrl.includes('localhost')) {
            finalTargetUrl = `http://${finalTargetUrl}`;
        } else {
            finalTargetUrl = `https://${finalTargetUrl}`;
        }
    }
    onStartScan(finalTargetUrl, selectedTools);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="new-scan-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-lg transition-colors duration-300 border border-slate-200 dark:border-slate-700"
      >
        <h2 id="new-scan-modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Start a New Scan
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="targetUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target URL
            </label>
            <input
              ref={inputRef} type="text" id="targetUrl" value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                if (error && (error.includes('URL') || error.includes('empty'))) setError(null);
              }}
              placeholder="e.g., https://example.com or localhost:8080"
              className={`w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border rounded-md shadow-sm px-4 py-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-300 ${error && (error.includes('URL') || error.includes('empty')) ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              aria-describedby={error && (error.includes('URL') || error.includes('empty')) ? "targetUrl-error" : undefined}
              aria-invalid={!!(error && (error.includes('URL') || error.includes('empty')))}
            />
            {error && (error.includes('URL') || error.includes('empty')) && <p id="targetUrl-error" className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="scanProfile" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scan Profile
            </label>
            <select
              id="scanProfile"
              value={selectedProfile}
              onChange={(e) => handleProfileChange(e.target.value as ScanProfile)}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
            >
              {Object.values(ScanProfile).map(profile => (
                <option key={profile} value={profile}>{profile}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Scan Tools {selectedProfile !== ScanProfile.CUSTOM && <span className="text-xs text-slate-500 dark:text-slate-400">(Profile: {selectedProfile})</span>}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md transition-colors duration-300">
              {availableToolsConfig.length > 0 ? availableToolsConfig.map(toolConfig => (
                <div key={toolConfig.id} className={`flex items-start p-2 rounded-md transition-colors ${selectedProfile === ScanProfile.CUSTOM ? 'bg-slate-100 dark:bg-slate-600/70 hover:bg-slate-200 dark:hover:bg-slate-600' : 'bg-transparent'}`}>
                  <input
                    type="checkbox"
                    id={`tool-${toolConfig.id}`}
                    checked={selectedTools.includes(toolConfig.id)}
                    onChange={() => handleToolToggle(toolConfig.id)}
                    className="h-4 w-4 text-teal-600 border-slate-400 dark:border-slate-500 rounded focus:ring-teal-500 mt-0.5"
                    disabled={selectedProfile !== ScanProfile.CUSTOM}
                  />
                  <label htmlFor={`tool-${toolConfig.id}`} className={`ml-3 text-sm ${selectedProfile !== ScanProfile.CUSTOM ? 'text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'text-slate-800 dark:text-slate-100'}`}>
                    <span className="font-medium">{toolConfig.label}</span>
                    <p className={`text-xs ${selectedProfile !== ScanProfile.CUSTOM ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{toolConfig.description}</p>
                  </label>
                </div>
              )) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No tools available based on current settings.</p>}
            </div>
             {error && error.includes('tool') && <p id="tool-selection-error" className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-md transition-colors shadow-sm flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-teal-500"
            >
              Start Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;