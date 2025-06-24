
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import NavigationBar from './components/NavigationBar';
import FilterControls from './components/FilterControls';
import ScanHistoryTable from './components/ScanHistoryTable';
import ScanDetailView from './components/ScanDetailView';
import NewScanModal from './components/NewScanModal';
import SettingsModal from './components/SettingsModal';
import DashboardOverview from './components/DashboardOverview'; // New
import ToastContainer from './components/ToastContainer'; // New
import { 
    Scan, ScanRating, Vulnerability, AvailableScanTools, VulnerabilityStatus, 
    Theme, SortConfig, SortDirection, SortableScanKeys, AppSettings, 
    ToolSpecificConfig, AppView, ToastMessage // Added AppView, ToastMessage
} from './types';
import { MOCK_SCANS, MOCK_VULNERABILITIES } from './constants';


const calculateOverallRating = (vulnerabilities: Vulnerability[]): ScanRating => {
  const openVulnerabilities = vulnerabilities.filter(v => v.status === VulnerabilityStatus.OPEN || v.status === VulnerabilityStatus.ACKNOWLEDGED);
  if (openVulnerabilities.length === 0) return ScanRating.NONE;

  const severityOrder = [ScanRating.CRITICAL, ScanRating.HIGH, ScanRating.MEDIUM, ScanRating.LOW, ScanRating.INFORMATIONAL];
  for (const severity of severityOrder) {
    if (openVulnerabilities.some(v => v.severity === severity)) {
      return severity;
    }
  }
  return ScanRating.NONE; 
};

const getRatingSortValue = (rating: ScanRating): number => {
  const order = [ScanRating.CRITICAL, ScanRating.HIGH, ScanRating.MEDIUM, ScanRating.LOW, ScanRating.INFORMATIONAL, ScanRating.NONE];
  return order.indexOf(rating);
};

const getDefaultAppSettings = (): AppSettings => {
  const initialEnabledTools: Record<AvailableScanTools, boolean> = {} as Record<AvailableScanTools, boolean>;
  const initialToolSpecificConfigs: Record<AvailableScanTools, ToolSpecificConfig> = {} as Record<AvailableScanTools, ToolSpecificConfig>;

  Object.values(AvailableScanTools).forEach(tool => {
    initialEnabledTools[tool] = true; // Enable all tools by default
    initialToolSpecificConfigs[tool] = { // Initialize placeholders
      endpoint: '',
      apiKeyPlaceholder: ''
    };
  });

  return {
    theme: 'dark',
    dashboard: {
      defaultSortKey: 'scanDate',
      defaultSortDirection: SortDirection.DESCENDING,
      itemsPerPage: 25,
    },
    tools: {
      enabledTools: initialEnabledTools,
      toolSpecificConfigs: initialToolSpecificConfigs,
    },
    apis: {
      geminiAIEnabled: true, // Simulate as initially enabled
      geminiAPIKeyPlaceholder: "",
      osvApiKeyPlaceholder: "",
    },
  };
};


const App: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>(MOCK_SCANS);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<ScanRating | 'all'>('all');
  const [targetUrlFilter, setTargetUrlFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ startDate: string | null, endDate: string | null }>({ startDate: null, endDate: null });
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('opensentinel-app-settings');
    const defaultSettings = getDefaultAppSettings();
    if (savedSettings) {
      try {
        let parsed = JSON.parse(savedSettings);
        parsed = {
          ...defaultSettings, ...parsed,
          dashboard: { ...defaultSettings.dashboard, ...parsed.dashboard },
          tools: {
            ...defaultSettings.tools, ...parsed.tools,
            enabledTools: { ...defaultSettings.tools.enabledTools, ...(parsed.tools?.enabledTools || {}), },
            toolSpecificConfigs: { ...defaultSettings.tools.toolSpecificConfigs, ...(parsed.tools?.toolSpecificConfigs || {}), },
          },
          apis: { ...defaultSettings.apis, ...parsed.apis },
        };
        Object.values(AvailableScanTools).forEach(tool => {
          if (typeof parsed.tools.enabledTools[tool] === 'undefined') parsed.tools.enabledTools[tool] = defaultSettings.tools.enabledTools[tool];
          if (typeof parsed.tools.toolSpecificConfigs[tool] === 'undefined') parsed.tools.toolSpecificConfigs[tool] = defaultSettings.tools.toolSpecificConfigs[tool];
          else parsed.tools.toolSpecificConfigs[tool] = { ...defaultSettings.tools.toolSpecificConfigs[tool], ...parsed.tools.toolSpecificConfigs[tool],};
        });
        return parsed;
      } catch (e) { console.error("Failed to parse settings from localStorage", e); return defaultSettings; }
    }
    return defaultSettings;
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: appSettings.dashboard.defaultSortKey, 
    direction: appSettings.dashboard.defaultSortDirection 
  });

  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('overview'); // New state for view management
  const [toasts, setToasts] = useState<ToastMessage[]>([]); // New state for toasts

  // Toast management functions
  const addToast = useCallback((message: string, type: ToastMessage['type'], duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (appSettings.theme === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
    localStorage.setItem('opensentinel-app-settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const updateAppSettings = (newSettings: Partial<AppSettings> | ((prevSettings: AppSettings) => Partial<AppSettings>)) => {
    setAppSettings(prev => {
        const updatedPartial = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
        return {
            ...prev, ...updatedPartial,
            dashboard: { ...prev.dashboard, ...updatedPartial.dashboard },
            tools: {
                ...prev.tools, ...updatedPartial.tools,
                enabledTools: { ...prev.tools.enabledTools, ...(updatedPartial.tools?.enabledTools || {}), },
                toolSpecificConfigs: { ...prev.tools.toolSpecificConfigs, ...(updatedPartial.tools?.toolSpecificConfigs || {}), },
            },
            apis: { ...prev.apis, ...updatedPartial.apis },
        };
    });
  };
  
  const toggleTheme = () => {
    const newTheme = appSettings.theme === 'light' ? 'dark' : 'light';
    updateAppSettings(prev => ({ ...prev, theme: newTheme }));
    addToast(`Theme changed to ${newTheme}`, 'info', 2000);
  };

  const filteredAndSortedScans = useMemo(() => {
    let filtered = scans.filter(scan => {
      const searchTermLower = searchTerm.toLowerCase();
      const targetUrlFilterLower = targetUrlFilter.toLowerCase();
      const matchesSearchTerm = searchTermLower === '' || scan.id.toLowerCase().includes(searchTermLower) || scan.targetUrl.toLowerCase().includes(searchTermLower);
      const matchesRating = selectedRatingFilter === 'all' || scan.overallRating === selectedRatingFilter;
      const matchesTargetUrl = targetUrlFilterLower === '' || scan.targetUrl.toLowerCase().includes(targetUrlFilterLower);
      let matchesDateRange = true;
      if (dateRangeFilter.startDate) matchesDateRange = matchesDateRange && new Date(scan.scanDate) >= new Date(dateRangeFilter.startDate);
      if (dateRangeFilter.endDate) { const inclusiveEndDate = new Date(dateRangeFilter.endDate); inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1); matchesDateRange = matchesDateRange && new Date(scan.scanDate) < inclusiveEndDate; }
      return matchesSearchTerm && matchesRating && matchesTargetUrl && matchesDateRange;
    });

    const currentSortConfig = { ...sortConfig };
    if (currentSortConfig.direction === SortDirection.NONE) {
        currentSortConfig.key = appSettings.dashboard.defaultSortKey;
        currentSortConfig.direction = appSettings.dashboard.defaultSortDirection;
    }

    filtered.sort((a, b) => {
      let valA: any = a[currentSortConfig.key]; let valB: any = b[currentSortConfig.key];
      if (currentSortConfig.key === 'scanDate') { valA = new Date(valA).getTime(); valB = new Date(valB).getTime(); }
      else if (currentSortConfig.key === 'overallRating') { valA = getRatingSortValue(valA as ScanRating); valB = getRatingSortValue(valB as ScanRating); }
      else if (typeof valA === 'string' && typeof valB === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return currentSortConfig.direction === SortDirection.ASCENDING ? -1 : 1;
      if (valA > valB) return currentSortConfig.direction === SortDirection.ASCENDING ? 1 : -1;
      if (currentSortConfig.key !== appSettings.dashboard.defaultSortKey || (currentSortConfig.key === appSettings.dashboard.defaultSortKey && currentSortConfig.key !== 'scanDate')) return new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime();
      return 0;
    });
    return filtered;
  }, [scans, searchTerm, selectedRatingFilter, targetUrlFilter, dateRangeFilter, sortConfig, appSettings.dashboard.defaultSortKey, appSettings.dashboard.defaultSortDirection]);

  const handleRequestSort = (key: SortableScanKeys) => {
    let direction = SortDirection.ASCENDING;
    if (sortConfig.key === key && sortConfig.direction === SortDirection.ASCENDING) direction = SortDirection.DESCENDING;
    else if (sortConfig.key === key && sortConfig.direction === SortDirection.DESCENDING) direction = SortDirection.NONE; 
    setSortConfig({ key, direction });
  };

  const handleSelectScan = (scan: Scan) => {
    setSelectedScan(scan);
    setCurrentView('dashboard'); // Switch to dashboard view when a scan is selected
  };

  const handleUpdateVulnerabilityStatus = useCallback((scanId: string, vulnerabilityId: string, newStatus: VulnerabilityStatus) => {
    setScans(prevScans => {
      const newScans = prevScans.map(s => {
        if (s.id === scanId) {
          const updatedVulnerabilities = s.vulnerabilities.map(v => v.id === vulnerabilityId ? { ...v, status: newStatus } : v);
          const updatedOverallRating = calculateOverallRating(updatedVulnerabilities);
          return { ...s, vulnerabilities: updatedVulnerabilities, overallRating: updatedOverallRating };
        }
        return s;
      });
      if (selectedScan && selectedScan.id === scanId) { const updatedScan = newScans.find(s => s.id === scanId); if (updatedScan) setSelectedScan(updatedScan); }
      return newScans;
    });
    addToast(`Vulnerability status updated to ${newStatus}`, 'success');
  }, [selectedScan, addToast]);

  const handleUpdateVulnerabilityNotes = useCallback((scanId: string, vulnerabilityId: string, newNotes: string) => {
    setScans(prevScans => {
      const newScans = prevScans.map(s => s.id === scanId ? { ...s, vulnerabilities: s.vulnerabilities.map(v => v.id === vulnerabilityId ? { ...v, notes: newNotes } : v) } : s);
      if (selectedScan && selectedScan.id === scanId) { const updatedScan = newScans.find(s => s.id === scanId); if (updatedScan) setSelectedScan(updatedScan); }
      return newScans;
    });
    addToast('Vulnerability notes saved', 'success');
  }, [selectedScan, addToast]);

  const handleStartScan = useCallback((targetUrl: string, tools: AvailableScanTools[]) => {
    const newScanId = `scan-${Date.now()}`;
    const initialScan: Scan = {
      id: newScanId, targetUrl, scanDate: new Date().toISOString(), overallRating: ScanRating.NONE,
      status: "Queued", vulnerabilities: [], toolsUsed: tools, aiSummary: undefined,
    };
    setScans(prevScans => [initialScan, ...prevScans]);
    if (filteredAndSortedScans.length === 0 || currentView === 'overview') {
        setSelectedScan(initialScan);
        setCurrentView('dashboard');
    }
    setIsNewScanModalOpen(false); 
    addToast(`Scan queued for ${targetUrl}`, 'info');

    setTimeout(() => {
      setScans(prevScans => prevScans.map(s => s.id === newScanId ? { ...s, status: "In Progress" } : s));
      if (selectedScan?.id === newScanId) setSelectedScan(prev => prev ? {...prev, status: "In Progress"} : null);
    }, 1500);

    setTimeout(() => {
      const foundVulnerabilities: Vulnerability[] = [];
      const numStandardVulnerabilities = Math.floor(Math.random() * (MOCK_VULNERABILITIES.length / 2));
      const shuffledStandardVulnerabilities = [...MOCK_VULNERABILITIES].sort(() => 0.5 - Math.random());
      foundVulnerabilities.push(...shuffledStandardVulnerabilities.slice(0, numStandardVulnerabilities).map(v => ({ ...v, id: `${newScanId}-${v.id.replace(/^vuln-/, '')}`, status: VulnerabilityStatus.OPEN, notes: undefined })));

      if (tools.includes(AvailableScanTools.BASIC_HEADER_SCAN)) {
        const serverTypes = ["Apache/2.4.58 (Unix)", "Nginx/1.25.3", "Microsoft-IIS/10.0", "LiteSpeed"];
        const phpVersions = ["PHP/8.2.1", "PHP/7.4.33", "PHP/8.1.12"];
        const cmsTypes = ["WordPress 6.4.2", "Joomla 4.3.4", "Drupal 10.1.5", "None Detected"];
        const mockServer = serverTypes[Math.floor(Math.random() * serverTypes.length)];
        const mockPhp = phpVersions[Math.floor(Math.random() * phpVersions.length)];
        const mockCms = cmsTypes[Math.floor(Math.random() * cmsTypes.length)];
        let evidenceText = `Basic Website Reconnaissance (Simulated for ${targetUrl}):\n\nGENERAL INFORMATION:\n  - Target IP: (Simulated - e.g., 192.0.2.1)\n  - Web Server: ${mockServer} (Simulated)\n`;
        if (Math.random() > 0.3) evidenceText += `  - X-Powered-By: ${mockPhp} (Simulated)\n`;
        if (mockCms !== "None Detected") evidenceText += `  - Detected CMS: ${mockCms} (Simulated)\n`;
        evidenceText += `  - Robots.txt: ${Math.random() > 0.4 ? 'Found, allows crawling of / (Simulated)' : 'Not found or restrictive (Simulated)'}\n\nHTTP SECURITY HEADER ANALYSIS (Simulated):\n`;
        const headers = [ { name: "Content-Security-Policy", present: Math.random() > 0.4, value: "default-src 'self'", critical: true, good: "Present, appears restrictive.", bad: "Missing - Critical for XSS protection." }, { name: "Strict-Transport-Security", present: Math.random() > 0.3, value: "max-age=31536000; includeSubDomains", good: "Present, HSTS enabled.", bad: "Missing - Enforce HTTPS communication." }, { name: "X-Frame-Options", present: Math.random() > 0.2, value: "SAMEORIGIN", good: "Present, protects against clickjacking.", bad: "Missing - Potential clickjacking risk." }, { name: "X-Content-Type-Options", present: Math.random() > 0.1, value: "nosniff", good: "Present, prevents MIME-sniffing.", bad: "Missing - Potential MIME-sniffing attacks." }, { name: "Referrer-Policy", present: Math.random() > 0.5, value: "strict-origin-when-cross-origin", good: "Present, controls referrer information.", bad: "Not specified or too permissive." }, { name: "Permissions-Policy", present: Math.random() > 0.6, value: "geolocation=(), microphone=()", good: "Present, restricts feature access.", bad: "Not specified, consider restricting features." } ];
        let missingCriticalHeader = false;
        headers.forEach(header => { const isPresent = header.present; evidenceText += `  - ${header.name}: ${isPresent ? header.value + ' (' + header.good + ')' : header.bad}\n`; if (header.critical && !isPresent) missingCriticalHeader = true; });
        evidenceText += `\nCOOKIE ANALYSIS (Simulated):\n`;
        if (Math.random() > 0.5) evidenceText += `  - session_id: HttpOnly, Secure, SameSite=Lax (Simulated - Good Practice)\n`;
        if (Math.random() > 0.3) evidenceText += `  - tracking_cookie: No HttpOnly, No Secure (Simulated - Potential Risk)\n`;
        if (Math.random() < 0.3) evidenceText += `  - No significant cookies found (Simulated)\n`;
        evidenceText += `\nNote: All findings above are illustrative and based on frontend simulation. A real backend scan is required for accurate data.`;
        foundVulnerabilities.push({ id: `${newScanId}-header-recon`, name: "Website Reconnaissance & Header Analysis (Simulated)", description: "This is a simulated analysis of basic website information and common HTTP security headers. All findings are illustrative. A real server-side scan is required for accurate data.", severity: missingCriticalHeader ? ScanRating.LOW : ScanRating.INFORMATIONAL, status: VulnerabilityStatus.OPEN, remediation: "Review server configuration, CMS updates, and HTTP security headers. Use server-side scanning tools for accurate assessment and implement best practices for each identified technology and header.", evidence: evidenceText, });
      }
      const overallRating = calculateOverallRating(foundVulnerabilities);
      setScans(prevScans => prevScans.map(s => s.id === newScanId ? { ...s, status: "Completed", vulnerabilities: foundVulnerabilities, overallRating: overallRating, } : s));
      if (selectedScan?.id === newScanId) setSelectedScan(prev => prev ? { ...prev, status: "Completed", vulnerabilities: foundVulnerabilities, overallRating: overallRating } : null);
      addToast(`Scan completed for ${targetUrl}`, 'success');
    }, 5000 + Math.random() * 2000);
  }, [selectedScan, filteredAndSortedScans, addToast, currentView]);

  useEffect(() => { setSortConfig({ key: appSettings.dashboard.defaultSortKey, direction: appSettings.dashboard.defaultSortDirection, }); }, [appSettings.dashboard.defaultSortKey, appSettings.dashboard.defaultSortDirection]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <NavigationBar 
        onOpenNewScanModal={() => setIsNewScanModalOpen(true)}
        currentTheme={appSettings.theme}
        onToggleTheme={toggleTheme}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        currentView={currentView}
        onSetCurrentView={setCurrentView}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {currentView === 'overview' ? (
          <DashboardOverview 
            scans={scans}
            onSelectScan={handleSelectScan} // This will also switch view via handleSelectScan
            onOpenNewScanModal={() => setIsNewScanModalOpen(true)}
            onViewAllScans={() => setCurrentView('dashboard')}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/5 flex flex-col space-y-6">
              <FilterControls
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                selectedRating={selectedRatingFilter}
                onRatingChange={setSelectedRatingFilter}
                targetUrlFilter={targetUrlFilter}
                onTargetUrlFilterChange={setTargetUrlFilter}
                dateRange={dateRangeFilter}
                onDateRangeChange={setDateRangeFilter}
              />
              <div className="flex-grow lg:max-h-[calc(100vh-290px)] lg:overflow-y-auto">
                   <ScanHistoryTable 
                      scans={filteredAndSortedScans} 
                      totalScansCount={scans.length}
                      onSelectScan={handleSelectScan} 
                      selectedScanId={selectedScan?.id}
                      sortConfig={sortConfig}
                      onRequestSort={handleRequestSort}
                    />
              </div>
            </div>
            <div className="lg:w-3/5 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto">
               <ScanDetailView 
                  scan={selectedScan} 
                  onUpdateVulnerabilityStatus={handleUpdateVulnerabilityStatus}
                  onUpdateVulnerabilityNotes={handleUpdateVulnerabilityNotes}
                  addToast={addToast} // Pass addToast
                />
            </div>
          </div>
        )}
      </main>
      <footer className="bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400 p-4 transition-colors duration-300">
        OpenSentinel Dashboard &copy; {new Date().getFullYear()}
      </footer>

      {isNewScanModalOpen && (
        <NewScanModal
          isOpen={isNewScanModalOpen}
          onClose={() => setIsNewScanModalOpen(false)}
          onStartScan={handleStartScan}
          enabledToolsFromSettings={appSettings.tools.enabledTools}
        />
      )}
       {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={appSettings}
          onUpdateSettings={updateAppSettings}
          addToast={addToast} // Pass addToast
        />
      )}
    </div>
  );
};

export default App;
