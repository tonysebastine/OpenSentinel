
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, AvailableScanTools, SortableScanKeys, SortDirection, Theme, ToolSpecificConfig, ToastMessage } from '../types'; // Added ToastMessage
import { SCAN_TOOLS_CONFIG } from '../constants';
import { SunIcon, MoonIcon, AlertTriangleIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings> | ((prevSettings: AppSettings) => Partial<AppSettings>)) => void;
  addToast: (message: string, type: ToastMessage['type'], duration?: number) => void; // New prop
}

type ActiveTab = 'dashboard' | 'tools' | 'apis';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onUpdateSettings, addToast }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const modalRef = useRef<HTMLDivElement>(null);
  // const [showSimulatedUpdateMessage, setShowSimulatedUpdateMessage] = useState<string | null>(null); // Replaced by toast


  useEffect(() => {
    if (isOpen) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

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

  const handleThemeChange = (theme: Theme) => {
    onUpdateSettings(prev => ({ ...prev, theme }));
  };

  const handleDefaultSortKeyChange = (key: SortableScanKeys) => {
    onUpdateSettings(prev => ({ ...prev, dashboard: { ...prev.dashboard, defaultSortKey: key }}));
  };

  const handleDefaultSortDirectionChange = (direction: SortDirection) => {
     onUpdateSettings(prev => ({ ...prev, dashboard: { ...prev.dashboard, defaultSortDirection: direction }}));
  };

  const handleItemsPerPageChange = (items: 10 | 25 | 50) => {
    onUpdateSettings(prev => ({ ...prev, dashboard: { ...prev.dashboard, itemsPerPage: items }}));
  };

  const handleToolToggle = (tool: AvailableScanTools) => {
    onUpdateSettings(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        enabledTools: {
          ...prev.tools.enabledTools,
          [tool]: !prev.tools.enabledTools[tool],
        },
      },
    }));
  };
  
  const handleGeminiAIEnableToggle = () => {
     onUpdateSettings(prev => ({
      ...prev,
      apis: {
        ...prev.apis,
        geminiAIEnabled: !prev.apis.geminiAIEnabled
      }
     }));
     addToast(`Gemini AI features (simulated backend status) ${!currentSettings.apis.geminiAIEnabled ? 'enabled' : 'disabled'}.`, 'info');
  };

  const handleApiKeyPlaceholderChange = (apiKeyType: 'gemini' | 'osv', value: string) => {
    onUpdateSettings(prev => ({
      ...prev,
      apis: {
        ...prev.apis,
        ...(apiKeyType === 'gemini' && { geminiAPIKeyPlaceholder: value }),
        ...(apiKeyType === 'osv' && { osvApiKeyPlaceholder: value }),
      }
    }));
  };
  
  const handleToolSpecificConfigChange = (toolId: AvailableScanTools, field: keyof ToolSpecificConfig, value: string) => {
    onUpdateSettings(prev => {
      const newToolConfigs = { ...prev.tools.toolSpecificConfigs };
      newToolConfigs[toolId] = {
        ...(newToolConfigs[toolId] || {}), 
        [field]: value
      };
      return {
        ...prev,
        tools: {
          ...prev.tools,
          toolSpecificConfigs: newToolConfigs
        }
      };
    });
  };

  const simulateKeyUpdate = (keyName: string) => {
    addToast(`${keyName} key update simulated (No actual backend change).`, 'info');
    console.log(`Simulated update for ${keyName}.`);
  };


  if (!isOpen) return null;

  const TabButton: React.FC<{ tabId: ActiveTab; currentTab: ActiveTab; onClick: (tabId: ActiveTab) => void; children: React.ReactNode }> = ({ tabId, currentTab, onClick, children }) => (
    <button
      role="tab"
      aria-selected={currentTab === tabId}
      aria-controls={`settings-tabpanel-${tabId}`}
      id={`settings-tab-${tabId}`}
      onClick={() => onClick(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400
        ${currentTab === tabId 
          ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-500' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="settings-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-800 p-0 rounded-lg shadow-2xl w-full max-w-2xl transition-colors duration-300 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 id="settings-modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Application Settings
            </h2>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700 px-2 sm:px-4">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Settings tabs" role="tablist">
            <TabButton tabId="dashboard" currentTab={activeTab} onClick={setActiveTab}>Dashboard</TabButton>
            <TabButton tabId="tools" currentTab={activeTab} onClick={setActiveTab}>Tools</TabButton>
            <TabButton tabId="apis" currentTab={activeTab} onClick={setActiveTab}>API Keys</TabButton>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'dashboard' && (
            <div role="tabpanel" id="settings-tabpanel-dashboard" aria-labelledby="settings-tab-dashboard">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Dashboard Appearance & Behavior</h3>
              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Theme</label>
                  <div className="flex space-x-2">
                    {(['light', 'dark'] as Theme[]).map(themeOption => (
                      <button
                        key={themeOption}
                        onClick={() => handleThemeChange(themeOption)}
                        className={`px-4 py-2 rounded-md text-sm border-2 transition-colors ${
                          currentSettings.theme === themeOption 
                            ? 'bg-teal-500 border-teal-600 text-white dark:bg-teal-600 dark:border-teal-500' 
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        {themeOption === 'light' ? <SunIcon className="w-5 h-5 inline mr-1"/> : <MoonIcon className="w-5 h-5 inline mr-1"/>}
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conceptual: Items Per Page */}
                <div>
                  <label htmlFor="itemsPerPage" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Items Per Page (Scan History)</label>
                  <select
                    id="itemsPerPage"
                    value={currentSettings.dashboard.itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value, 10) as 10 | 25 | 50)}
                    className="w-full sm:w-1/2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
                  >
                    {[10, 25, 50].map(val => <option key={val} value={val}>{val} items</option>)}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Note: Pagination not yet implemented. This is a conceptual setting.</p>
                </div>

                {/* Conceptual: Default Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Default Sort for Scan History</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={currentSettings.dashboard.defaultSortKey}
                      onChange={(e) => handleDefaultSortKeyChange(e.target.value as SortableScanKeys)}
                      className="flex-grow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
                    >
                      {(['scanDate', 'id', 'targetUrl', 'overallRating'] as SortableScanKeys[]).map(key => (
                        <option key={key} value={key}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <select
                      value={currentSettings.dashboard.defaultSortDirection}
                      onChange={(e) => handleDefaultSortDirectionChange(e.target.value as SortDirection)}
                      className="flex-grow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
                    >
                      {(['ascending', 'descending'] as Exclude<SortDirection, SortDirection.NONE>[]).map(dir => (
                        <option key={dir} value={dir}>{dir.charAt(0).toUpperCase() + dir.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div role="tabpanel" id="settings-tabpanel-tools" aria-labelledby="settings-tab-tools">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Scan Tool Preferences & Configurations</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Toggle tool visibility in the "New Scan" modal. Conceptual endpoint and API key fields are illustrative for backend setup.
              </p>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {SCAN_TOOLS_CONFIG.map(toolConfig => (
                  <div key={toolConfig.id} className="p-3 bg-slate-100 dark:bg-slate-700/70 rounded-md border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor={`tool-enable-${toolConfig.id}`} className="flex items-center cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{toolConfig.label}</span>
                      </label>
                      <input
                        type="checkbox"
                        id={`tool-enable-${toolConfig.id}`}
                        checked={currentSettings.tools.enabledTools[toolConfig.id] ?? true}
                        onChange={() => handleToolToggle(toolConfig.id)}
                        className="h-5 w-5 text-teal-600 border-slate-400 dark:border-slate-500 rounded focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700/70"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{toolConfig.description}</p>
                    
                    <div className="space-y-2 text-xs">
                        <div>
                            <label htmlFor={`tool-endpoint-${toolConfig.id}`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">Conceptual Backend Endpoint:</label>
                            <input 
                                type="text"
                                id={`tool-endpoint-${toolConfig.id}`}
                                placeholder="e.g., /api/tools/nmap or leave blank"
                                value={currentSettings.tools.toolSpecificConfigs[toolConfig.id]?.endpoint || ''}
                                onChange={(e) => handleToolSpecificConfigChange(toolConfig.id, 'endpoint', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 rounded-md shadow-sm px-2 py-1 text-xs focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label htmlFor={`tool-apikey-${toolConfig.id}`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">Conceptual Tool API Key (if applicable):</label>
                            <input 
                                type="password"
                                id={`tool-apikey-${toolConfig.id}`}
                                placeholder="Backend managed API key for this tool"
                                value={currentSettings.tools.toolSpecificConfigs[toolConfig.id]?.apiKeyPlaceholder || ''}
                                onChange={(e) => handleToolSpecificConfigChange(toolConfig.id, 'apiKeyPlaceholder', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 rounded-md shadow-sm px-2 py-1 text-xs focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'apis' && (
            <div role="tabpanel" id="settings-tabpanel-apis" aria-labelledby="settings-tab-apis">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">API Key Configuration (Illustrative)</h3>
              <div 
                className="p-4 bg-amber-50 dark:bg-amber-800/30 border-l-4 border-amber-500 dark:border-amber-400 rounded-md text-amber-700 dark:text-amber-300 mb-6"
                role="alert"
              >
                <div className="flex items-start">
                  <AlertTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" aria-hidden="true"/> 
                  <div>
                    <h4 className="font-semibold">Important Security Notice</h4>
                    <p className="text-sm">API keys (like Google Gemini API Key) are sensitive credentials and **must** be configured and stored securely on the **backend server environment variables** or a secrets management service. They should **NEVER** be entered or stored in the frontend dashboard. The fields below are for illustrative purposes only.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Gemini API */}
                <div className="p-4 bg-slate-100 dark:bg-slate-700/70 rounded-md border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700 dark:text-slate-200">Google Gemini AI Features</h4>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${currentSettings.apis.geminiAIEnabled ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                        {currentSettings.apis.geminiAIEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button 
                            onClick={handleGeminiAIEnableToggle}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                            title="Simulate backend config change for demo"
                        >
                            (Toggle Sim)
                        </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">Status indicates if the backend is configured to use Gemini AI for summaries and insights.</p>
                  <div>
                      <label htmlFor="geminiApiKey" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">Gemini API Key (Backend Configuration - Illustrative Input)</label>
                      <input 
                          type="password"
                          id="geminiApiKey"
                          placeholder="Illustrative only - configured on backend"
                          value={currentSettings.apis.geminiAPIKeyPlaceholder}
                          onChange={(e) => handleApiKeyPlaceholderChange('gemini', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 rounded-md shadow-sm px-2 py-1 text-xs focus:ring-teal-500 focus:border-teal-500"
                      />
                  </div>
                  <button onClick={() => simulateKeyUpdate('Gemini API Key')} className="mt-2 text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-md shadow-sm">Simulate Key Update</button>
                </div>

                {/* OSV.dev API (Conceptual) */}
                <div className="p-4 bg-slate-100 dark:bg-slate-700/70 rounded-md border border-slate-200 dark:border-slate-600">
                  <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">OSV.dev API (Conceptual)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">For CVE lookups. Configured on backend.</p>
                   <div>
                      <label htmlFor="osvApiKey" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">OSV.dev API Key (Backend Configuration - Illustrative Input)</label>
                      <input 
                          type="password"
                          id="osvApiKey"
                          placeholder="Illustrative only - configured on backend"
                          value={currentSettings.apis.osvApiKeyPlaceholder}
                          onChange={(e) => handleApiKeyPlaceholderChange('osv', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 rounded-md shadow-sm px-2 py-1 text-xs focus:ring-teal-500 focus:border-teal-500"
                      />
                  </div>
                  <button onClick={() => simulateKeyUpdate('OSV.dev API Key')} className="mt-2 text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-md shadow-sm">Simulate Key Update</button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 text-right">
            <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-400"
            >
            Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
