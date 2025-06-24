
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scan, Vulnerability, ScanRating, GroundingSource, VulnerabilityStatus, ToastMessage } from '../types'; // Added ToastMessage
import { RATING_COLORS, RATING_TEXT_COLORS, VULNERABILITY_STATUS_CONFIG } from '../constants';
import { generateScanSummaryAndInsights } from '../services/geminiService';
import { ExportIcon, InfoIcon, AlertTriangleIcon, LoadingSpinner, ExternalLinkIcon, LinkIcon, ChevronDownIcon, CheckCircleIcon, ClipboardCopyIcon, ClipboardCheckIcon } from './icons';

interface CopyState {
  name: boolean;
  cve: boolean;
  evidence: boolean;
}

interface VulnerabilityCardProps {
  vuln: Vulnerability;
  scanId: string;
  onUpdateStatus: (scanId: string, vulnerabilityId: string, newStatus: VulnerabilityStatus) => void;
  onUpdateNotes: (scanId: string, vulnerabilityId: string, newNotes: string) => void;
  addToast: (message: string, type: ToastMessage['type'], duration?: number) => void; // New prop
}

const VulnerabilityCard: React.FC<VulnerabilityCardProps> = ({ vuln, scanId, onUpdateStatus, onUpdateNotes, addToast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(vuln.notes || '');
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyState, setCopyState] = useState<CopyState>({ name: false, cve: false, evidence: false });

  useEffect(() => {
    setCurrentNotes(vuln.notes || '');
  }, [vuln.notes]);
  
  useEffect(() => {
    if (editingNotes && notesTextareaRef.current) {
        notesTextareaRef.current.focus();
        const textarea = notesTextareaRef.current;
        textarea.style.height = 'auto'; 
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editingNotes]);

  const handleCopyToClipboard = async (textToCopy: string | undefined, fieldName: string, field: keyof CopyState) => {
    if (!textToCopy || !navigator.clipboard) {
      addToast(`Clipboard API not available.`, 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyState(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setCopyState(prev => ({ ...prev, [field]: false })), 2000);
      addToast(`${fieldName} copied to clipboard!`, 'success', 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      addToast(`Failed to copy ${fieldName}.`, 'error');
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(scanId, vuln.id, currentNotes);
    setEditingNotes(false);
    // Toast for note save is handled in App.tsx via onUpdateNotes prop
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNotes(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const statusConfig = VULNERABILITY_STATUS_CONFIG[vuln.status];
  const severityBorderColor = 
    vuln.severity === ScanRating.CRITICAL ? 'border-red-500 dark:border-red-500' :
    vuln.severity === ScanRating.HIGH ? 'border-orange-500 dark:border-orange-400' :
    vuln.severity === ScanRating.MEDIUM ? 'border-yellow-500 dark:border-yellow-400' :
    vuln.severity === ScanRating.LOW ? 'border-blue-500 dark:border-blue-400' :
    'border-slate-500 dark:border-slate-400';

  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-md shadow-md border border-slate-200 dark:border-slate-700 border-l-4 ${severityBorderColor} transition-colors duration-300`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start">
        <div className="flex items-center group">
          <h4 className={`text-lg font-semibold ${RATING_TEXT_COLORS[vuln.severity]}`}>{vuln.name}</h4>
          <button 
            onClick={() => handleCopyToClipboard(vuln.name, 'Name', 'name')} 
            title="Copy name"
            className="ml-2 p-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            {copyState.name ? <ClipboardCheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardCopyIcon className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusConfig.color} ${statusConfig.textColor}`}>
                {statusConfig.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${RATING_COLORS[vuln.severity]}`}>
              {vuln.severity}
            </span>
        </div>
      </div>
      {vuln.cveId && (
        <div className="flex items-center group mt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
            CVE: {vuln.cveId} {vuln.isKev && <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-red-600 dark:bg-red-700 text-red-100 rounded">KEV</span>}
            </p>
            <button 
                onClick={() => handleCopyToClipboard(vuln.cveId, 'CVE ID', 'cve')} 
                title="Copy CVE ID"
                className="ml-2 p-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
                {copyState.cve ? <ClipboardCheckIcon className="h-3 w-3 text-green-500" /> : <ClipboardCopyIcon className="h-3 w-3" />}
            </button>
        </div>
      )}
      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{vuln.description}</p>
      
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-x-4">
        {vuln.cvssScore && <span>CVSS: <span className="font-semibold text-slate-700 dark:text-slate-200">{vuln.cvssScore.toFixed(1)}</span></span>}
        {vuln.epssScore && <span>EPSS: <span className="font-semibold text-slate-700 dark:text-slate-200">{(vuln.epssScore * 100).toFixed(1)}%</span></span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {(vuln.remediation || vuln.evidence || vuln.notes || (!vuln.notes && !editingNotes)) && 
            <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 text-sm inline-flex items-center font-medium"
            aria-expanded={isExpanded}
            aria-controls={`vuln-details-${vuln.id}`}
            >
            {isExpanded ? 'Show Less' : 'Show More Details'} <ChevronDownIcon className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
        }
        <div className="relative inline-block text-left">
            <select
                value={vuln.status}
                onChange={(e) => onUpdateStatus(scanId, vuln.id, e.target.value as VulnerabilityStatus)}
                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-colors duration-300"
                aria-label={`Change status for ${vuln.name}`}
            >
                {Object.values(VulnerabilityStatus).map(s => (
                <option key={s} value={s}>{VULNERABILITY_STATUS_CONFIG[s].label}</option>
                ))}
            </select>
        </div>
      </div>

      {isExpanded && (
        <div id={`vuln-details-${vuln.id}`} className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-700 transition-colors duration-300">
          {vuln.evidence && (
            <div className="group">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Evidence:</h5>
                <button 
                    onClick={() => handleCopyToClipboard(vuln.evidence, 'Evidence', 'evidence')} 
                    title="Copy evidence"
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                    {copyState.evidence ? <ClipboardCheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardCopyIcon className="h-4 w-4" />}
                </button>
              </div>
              <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all transition-colors duration-300 border border-slate-200 dark:border-slate-700">{vuln.evidence}</pre>
            </div>
          )}
          {vuln.remediation && (
            <div className="mt-2">
              <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Remediation:</h5>
              <p className="text-xs text-slate-600 dark:text-slate-300">{vuln.remediation}</p>
            </div>
          )}
          <div className="mt-3">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Notes:</h5>
            {editingNotes ? (
              <div>
                <textarea
                  ref={notesTextareaRef}
                  value={currentNotes}
                  onChange={handleNotesChange}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-700 p-2 rounded text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 min-h-[60px] resize-none overflow-hidden transition-colors duration-300"
                  placeholder="Add notes..."
                  aria-label={`Notes for ${vuln.name}`}
                  rows={1}
                />
                <div className="mt-2 space-x-2">
                  <button onClick={handleSaveNotes} className="text-xs bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-3 py-1 rounded-md shadow-sm">Save Notes</button>
                  <button onClick={() => { setEditingNotes(false); setCurrentNotes(vuln.notes || ''); }} className="text-xs bg-slate-500 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white dark:text-slate-200 px-3 py-1 rounded-md shadow-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line min-h-[20px]">{currentNotes || <span className="text-slate-400 dark:text-slate-500">No notes added.</span>}</p>
                <button onClick={() => setEditingNotes(true)} className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 mt-1 font-medium">
                  {currentNotes ? 'Edit Notes' : 'Add Notes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}
const SkeletonLine: React.FC<SkeletonLineProps> = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`bg-slate-300 dark:bg-slate-700 rounded skeleton-pulse ${width} ${height} ${className} transition-colors duration-300`}></div>
);


interface ScanDetailViewProps {
  scan: Scan | null;
  onUpdateVulnerabilityStatus: (scanId: string, vulnerabilityId: string, newStatus: VulnerabilityStatus) => void;
  onUpdateVulnerabilityNotes: (scanId: string, vulnerabilityId: string, newNotes: string) => void;
  addToast: (message: string, type: ToastMessage['type'], duration?: number) => void; // New prop
}

const ScanDetailView: React.FC<ScanDetailViewProps> = ({ scan, onUpdateVulnerabilityStatus, onUpdateVulnerabilityNotes, addToast }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRemediationTips, setAiRemediationTips] = useState<string[]>([]);
  const [aiKeyFindings, setAiKeyFindings] = useState<string[]>([]);
  const [aiSources, setAiSources] = useState<GroundingSource[] | undefined>(undefined);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateSummary = useCallback(async () => {
    if (!scan) return;
    setIsLoadingAiSummary(true);
    setAiError(null);
    setAiSummary(null);
    setAiRemediationTips([]);
    setAiKeyFindings([]);
    setAiSources(undefined);
    addToast('Generating AI summary...', 'info', 2000);

    try {
      const result = await generateScanSummaryAndInsights(scan);
      setAiSummary(result.summary);
      setAiRemediationTips(result.remediationTips);
      setAiKeyFindings(result.keyFindings);
      setAiSources(result.sources);
      addToast('AI summary generated!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating AI summary.";
      setAiError(errorMessage);
      addToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoadingAiSummary(false);
    }
  }, [scan, addToast]);
  
  useEffect(() => {
    setAiSummary(scan?.aiSummary || null);
    setAiRemediationTips(scan?.remediationSuggestions || []);
    setAiKeyFindings([]); 
    setAiError(null);
    setIsLoadingAiSummary(false);
    setAiSources(undefined);
  }, [scan]);

  if (!scan) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300" role="region" aria-label="Scan Details Pane - No Scan Selected">
        <InfoIcon className="h-16 w-16 text-teal-600 dark:text-teal-500 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Scan Selected</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Please select a scan from the list to view its details.</p>
      </div>
    );
  }

  const openVulnerabilitiesCount = scan.vulnerabilities.filter(v => v.status === VulnerabilityStatus.OPEN || v.status === VulnerabilityStatus.ACKNOWLEDGED).length;


  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl h-full overflow-y-auto transition-colors duration-300 border border-slate-200 dark:border-slate-700" role="region" aria-labelledby="scan-detail-heading">
      <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 pb-4 border-b border-slate-300 dark:border-slate-700 transition-colors duration-300">
        <div>
          <h2 id="scan-detail-heading" className="text-2xl font-bold text-slate-800 dark:text-slate-100 break-all">{scan.targetUrl}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scanned on: {new Date(scan.scanDate).toLocaleString()} | ID: {scan.id}
          </p>
        </div>
        <div className="mt-2 md:mt-0 text-right">
            <div className={`px-3 py-1.5 text-lg font-semibold rounded-md inline-block ${RATING_COLORS[scan.overallRating]}`}>
            {scan.overallRating}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{openVulnerabilitiesCount} Open Vulnerabilities</p>
        </div>
      </div>

      {scan.toolsUsed && scan.toolsUsed.length > 0 && (
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/60 rounded-lg transition-colors duration-300 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Tools Used</h3>
          <div className="flex flex-wrap gap-2">
            {scan.toolsUsed.map(tool => (
              <span key={tool} className="px-2 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/60 rounded-lg transition-colors duration-300 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">AI-Powered Analysis</h3>
        {isLoadingAiSummary && (
          <div role="status" aria-live="polite" className="space-y-3">
            <SkeletonLine height="h-5" width="w-1/3" />
            <SkeletonLine />
            <SkeletonLine width="w-5/6" />
            <SkeletonLine height="h-5" width="w-1/4" className="mt-3"/>
            <SkeletonLine width="w-4/5"/>
            <SkeletonLine width="w-2/3"/>
          </div>
        )}
        {aiError && (
          <div className="p-3 bg-red-100 dark:bg-red-800/30 border border-red-300 dark:border-red-600 rounded-md text-red-700 dark:text-red-300 transition-colors duration-300" role="alert">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-5 w-5 mr-2" aria-hidden="true"/> 
              <p>Error: {aiError}</p>
            </div>
          </div>
        )}
        {!isLoadingAiSummary && !aiError && aiSummary && (
          <div aria-live="polite">
            <h4 className="text-md font-semibold text-teal-600 dark:text-teal-400 mb-1">Summary:</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-line">{aiSummary}</p>
            {aiKeyFindings.length > 0 && (
              <>
                <h4 className="text-md font-semibold text-teal-600 dark:text-teal-400 mt-3 mb-1">Key Findings:</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {aiKeyFindings.map((finding, index) => <li key={index}>{finding}</li>)}
                </ul>
              </>
            )}
            {aiRemediationTips.length > 0 && (
              <>
                <h4 className="text-md font-semibold text-teal-600 dark:text-teal-400 mt-3 mb-1">Remediation Tips:</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {aiRemediationTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              </>
            )}
             {aiSources && aiSources.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-teal-600 dark:text-teal-400 mb-1 flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2" aria-hidden="true"/> Information Sources:
                </h4>
                <ul className="list-none text-sm text-slate-500 dark:text-slate-400 space-y-1">
                  {aiSources.map((source, index) => (
                    <li key={index} className="flex items-center">
                      <ExternalLinkIcon className="h-3 w-3 mr-1.5 flex-shrink-0" aria-hidden="true"/>
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" title={source.title} className="hover:text-teal-500 dark:hover:text-teal-300 underline truncate">
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {!isLoadingAiSummary && !aiSummary && !aiError && scan.status === "Completed" && (
          <button
            onClick={handleGenerateSummary}
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700/60 focus:ring-teal-500"
            disabled={isLoadingAiSummary}
          >
            {isLoadingAiSummary ? <LoadingSpinner className="h-5 w-5 mr-2" aria-hidden="true" /> : <InfoIcon className="h-5 w-5 mr-2" aria-hidden="true"/>}
            Generate AI Summary & Insights
          </button>
        )}
         {scan.status !== "Completed" && !aiSummary && (
            <p className="text-sm text-slate-500 dark:text-slate-400">AI analysis available once scan is completed.</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Vulnerabilities ({scan.vulnerabilities.length})
        </h3>
        {scan.vulnerabilities.length > 0 ? (
          <div className="space-y-4">
            {scan.vulnerabilities.map(vuln => 
              <VulnerabilityCard 
                key={vuln.id} 
                vuln={vuln} 
                scanId={scan.id}
                onUpdateStatus={onUpdateVulnerabilityStatus}
                onUpdateNotes={onUpdateVulnerabilityNotes}
                addToast={addToast} // Pass addToast
              />)
            }
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No vulnerabilities found in this scan.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Actions</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => { addToast("Conceptual: Export to CSV (see FUTURE_INTEGRATION_GUIDE.md)", "info"); alert("Conceptual: Export to CSV (see FUTURE_INTEGRATION_GUIDE.md)"); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-blue-500"
          >
            <ExportIcon className="h-5 w-5 mr-2" aria-hidden="true"/> Export to CSV
          </button>
          <button
            onClick={() => { addToast("Conceptual: Export to PDF (see FUTURE_INTEGRATION_GUIDE.md)", "info"); alert("Conceptual: Export to PDF (see FUTURE_INTEGRATION_GUIDE.md)"); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors duration-150 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-green-500"
          >
            <ExportIcon className="h-5 w-5 mr-2" aria-hidden="true"/> Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanDetailView;
