
import React from 'react';
import { Scan, ScanRating, VulnerabilityStatus, AppView } from '../types';
import { RATING_COLORS, RATING_TEXT_COLORS } from '../constants';
import { PlusCircleIcon, ListBulletIcon, CheckCircleIcon, AlertTriangleIcon, ShieldIcon } from './icons';

interface DashboardOverviewProps {
  scans: Scan[];
  onSelectScan: (scan: Scan) => void; // Will also set view to 'dashboard'
  onOpenNewScanModal: () => void;
  onViewAllScans: () => void; // Sets view to 'dashboard' without selecting a scan
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
    scans, 
    onSelectScan, 
    onOpenNewScanModal,
    onViewAllScans
}) => {
  const totalScans = scans.length;
  const activeScans = scans.filter(s => s.status === 'In Progress' || s.status === 'Queued').length;
  
  const completedScans = scans.filter(s => s.status === 'Completed');
  
  const openCriticalVulnerabilities = completedScans.reduce((count, scan) => {
    return count + scan.vulnerabilities.filter(v => 
      v.severity === ScanRating.CRITICAL && 
      (v.status === VulnerabilityStatus.OPEN || v.status === VulnerabilityStatus.ACKNOWLEDGED)
    ).length;
  }, 0);

  const totalVulnerabilitiesInCompletedScans = completedScans.reduce((count, scan) => count + scan.vulnerabilities.length, 0);
  const averageVulnerabilitiesPerScan = completedScans.length > 0 
    ? (totalVulnerabilitiesInCompletedScans / completedScans.length) 
    : 0;

  const severityCounts: Record<ScanRating, number> = {
    [ScanRating.CRITICAL]: 0,
    [ScanRating.HIGH]: 0,
    [ScanRating.MEDIUM]: 0,
    [ScanRating.LOW]: 0,
    [ScanRating.INFORMATIONAL]: 0,
    [ScanRating.NONE]: 0, // Should typically be 0 for open vulns
  };

  completedScans.forEach(scan => {
    scan.vulnerabilities.forEach(vuln => {
      if (vuln.status === VulnerabilityStatus.OPEN || vuln.status === VulnerabilityStatus.ACKNOWLEDGED) {
        severityCounts[vuln.severity]++;
      }
    });
  });
  const maxSeverityCount = Math.max(...Object.values(severityCounts), 1); // Avoid division by zero, ensure at least 1 for bar height

  const recentScans = [...scans]
    .sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime())
    .slice(0, 5);

  const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; colorClass?: string }> = ({ title, value, icon, colorClass = "text-teal-600 dark:text-teal-400" }) => (
    <div className="bg-slate-100 dark:bg-slate-700/60 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center space-x-3">
        {icon && <div className={`p-2 rounded-full bg-slate-200 dark:bg-slate-600 ${colorClass}`}>{icon}</div>}
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
  
  const getStatusIcon = (status: Scan['status']) => {
    switch(status) {
      case "Completed": return <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case "In Progress": return <div className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse mr-1"></div>;
      case "Failed": return <AlertTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case "Queued": return <div className="h-2.5 w-2.5 bg-yellow-500 rounded-full mr-1"></div>;
      default: return null;
    }
  };

  if (totalScans === 0) {
    return (
      <div className="p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <ShieldIcon className="h-20 w-20 text-teal-600 dark:text-teal-500 mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Welcome to OpenSentinel!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This is your central dashboard for managing web security scans. 
          Get started by initiating your first scan.
        </p>
        <button
          onClick={onOpenNewScanModal}
          className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-md shadow-lg transition-colors duration-150 flex items-center mx-auto text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-teal-500"
        >
          <PlusCircleIcon className="h-6 w-6 mr-2" />
          Start Your First Scan
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard Overview</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scans" value={totalScans} />
        <StatCard title="Active Scans" value={activeScans} colorClass={activeScans > 0 ? "text-blue-600 dark:text-blue-400" : undefined}/>
        <StatCard title="Open Critical Vulns" value={openCriticalVulnerabilities} colorClass={openCriticalVulnerabilities > 0 ? "text-red-600 dark:text-red-400" : undefined}/>
        <StatCard title="Avg Vulns / Scan" value={averageVulnerabilitiesPerScan.toFixed(1)} />
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <button
          onClick={onOpenNewScanModal}
          className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-teal-500"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Scan
        </button>
        <button
          onClick={onViewAllScans}
          className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-slate-500"
        >
          <ListBulletIcon className="h-5 w-5 mr-2" />
          View All Scans
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="lg:col-span-1 bg-slate-100 dark:bg-slate-700/60 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Open Vulnerability Distribution</h2>
          <div className="space-y-2">
            {Object.entries(severityCounts)
                .filter(([rating]) => rating !== ScanRating.NONE || severityCounts[ScanRating.NONE] > 0) // Hide 'None' if count is 0
                .sort(([aRating], [bRating]) => { // Sort by severity order
                    const order = [ScanRating.CRITICAL, ScanRating.HIGH, ScanRating.MEDIUM, ScanRating.LOW, ScanRating.INFORMATIONAL, ScanRating.NONE];
                    return order.indexOf(aRating as ScanRating) - order.indexOf(bRating as ScanRating);
                })
                .map(([rating, count]) => (
              <div key={rating} className="flex items-center">
                <span className={`w-28 text-xs font-medium ${RATING_TEXT_COLORS[rating as ScanRating]} pr-2`}>{rating}:</span>
                <div className="flex-grow bg-slate-200 dark:bg-slate-600 rounded-full h-4 mr-2 overflow-hidden border border-slate-300 dark:border-slate-500">
                  <div 
                    className={`${RATING_COLORS[rating as ScanRating].split(' ')[0]} h-full rounded-full text-xs text-white flex items-center justify-end pr-1 transition-all duration-500 ease-out`}
                    style={{ width: `${(count / maxSeverityCount) * 100}%` }}
                    title={`${count} ${rating} vulnerabilities`}
                  >
                  </div>
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
           {Object.values(severityCounts).reduce((a,b) => a+b, 0) === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No open vulnerabilities found in completed scans.</p>
            )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-700/60 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent Scan Activity</h2>
          {recentScans.length > 0 ? (
            <ul className="space-y-3">
              {recentScans.map(scan => (
                <li key={scan.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-600 transition-colors duration-300">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md" title={scan.targetUrl}>{scan.targetUrl}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(scan.scanDate).toLocaleDateString()} - 
                      <span className={`ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center ${RATING_COLORS[scan.overallRating]}`}>
                        {scan.overallRating}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        {getStatusIcon(scan.status)}
                        <span className="ml-1">{scan.status}</span>
                    </div>
                    <button
                      onClick={() => onSelectScan(scan)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 font-medium px-2 py-1 rounded-md hover:bg-teal-100 dark:hover:bg-teal-700/50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No scan activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
