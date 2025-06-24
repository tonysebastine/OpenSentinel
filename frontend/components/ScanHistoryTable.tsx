
import React from 'react';
import { Scan, ScanRating, SortConfig, SortDirection, SortableScanKeys } from '../types';
import { RATING_COLORS } from '../constants';
import { ChevronRightIcon, AlertTriangleIcon, CheckCircleIcon, SortAscendingIcon, SortDescendingIcon, SortIcon, PlusCircleIcon, ShieldIcon } from './icons';

interface ScanHistoryTableProps {
  scans: Scan[];
  totalScansCount: number;
  onSelectScan: (scan: Scan) => void;
  selectedScanId?: string;
  sortConfig: SortConfig;
  onRequestSort: (key: SortableScanKeys) => void;
}

const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({ 
  scans, 
  totalScansCount,
  onSelectScan, 
  selectedScanId,
  sortConfig,
  onRequestSort
}) => {

  const getSortIcon = (key: SortableScanKeys) => {
    if (sortConfig.key !== key || sortConfig.direction === SortDirection.NONE) {
      return <SortIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400" />;
    }
    if (sortConfig.direction === SortDirection.ASCENDING) {
      return <SortAscendingIcon className="h-4 w-4 text-teal-600 dark:text-teal-500" />;
    }
    return <SortDescendingIcon className="h-4 w-4 text-teal-600 dark:text-teal-500" />;
  };

  const renderHeaderCell = (label: string, key: SortableScanKeys) => (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group"
      onClick={() => onRequestSort(key)}
      aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
    >
      <div className="flex items-center">
        {label}
        <span className="ml-1">{getSortIcon(key)}</span>
      </div>
    </th>
  );
  
  if (totalScansCount === 0) {
    return (
      <div className="p-6 text-center bg-slate-200 dark:bg-slate-800 rounded-lg shadow-md transition-colors duration-300 border border-slate-300 dark:border-slate-700">
        <ShieldIcon className="h-16 w-16 text-teal-600 dark:text-teal-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Welcome to OpenSentinel!</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">No scans have been performed yet. Start your first security scan to see results here.</p>
        <button 
          onClick={() => (document.querySelector('button[aria-haspopup="dialog"]') as HTMLElement)?.click()}
          className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center mx-auto focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-200 dark:focus:ring-offset-slate-800 focus:ring-teal-500"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Start First Scan
        </button>
      </div>
    );
  }

  if (scans.length === 0 && totalScansCount > 0) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 rounded-lg shadow-sm transition-colors duration-300 border border-slate-300 dark:border-slate-700">No scans found matching your current filter criteria.</div>;
  }
  
  const getStatusIcon = (status: Scan['status']) => {
    switch(status) {
      case "Completed": return <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case "In Progress": return <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>; // Keep colors for status meaning
      case "Failed": return <AlertTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case "Queued": return <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-300 border border-slate-300 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-700 transition-colors duration-300">
            <tr>
              {renderHeaderCell('Scan ID', 'id')}
              {renderHeaderCell('Target URL', 'targetUrl')}
              {renderHeaderCell('Date', 'scanDate')}
              {renderHeaderCell('Rating', 'overallRating')}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vulns</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 transition-colors duration-300">
            {scans.map((scan) => (
              <tr 
                key={scan.id} 
                onClick={() => onSelectScan(scan)} 
                className={`hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors duration-150 ${selectedScanId === scan.id ? 'bg-teal-50 dark:bg-teal-600/20' : ''}`}
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectScan(scan);}}
                role="button"
                aria-pressed={selectedScanId === scan.id}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{scan.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">{scan.targetUrl}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{new Date(scan.scanDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${RATING_COLORS[scan.overallRating]}`}>
                    {scan.overallRating}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center">{scan.vulnerabilities.length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(scan.status)}
                    <span>{scan.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <ChevronRightIcon className="h-5 w-5 text-teal-600 dark:text-teal-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScanHistoryTable;