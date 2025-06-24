
export enum ScanRating {
  CRITICAL = "Critical",
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
  INFORMATIONAL = "Informational",
  NONE = "None"
}

export enum VulnerabilityStatus {
  OPEN = "Open",
  ACKNOWLEDGED = "Acknowledged",
  FALSE_POSITIVE = "False Positive",
  FIXED = "Fixed"
}

export interface Vulnerability {
  id: string;
  cveId?: string;
  name: string;
  description: string;
  severity: ScanRating;
  status: VulnerabilityStatus; // New field
  notes?: string; // New field
  cvssScore?: number;
  epssScore?: number; // Exploit Prediction Scoring System
  isKev?: boolean; // Known Exploited Vulnerability
  remediation?: string;
  evidence?: string;
}

export enum AvailableScanTools {
  PORT_SCAN = "Port Scan (Nmap/httpx)",
  NUCLEI_SCAN = "Nuclei Vulnerability Scan",
  OWASP_ZAP_ACTIVE = "OWASP ZAP Active Scan",
  SUBDOMAIN_ENUM = "Subdomain Enumeration (Subfinder/Amass)",
  DIR_FUZZING = "Directory Fuzzing (Dirsearch/Gobuster)",
  TECH_DETECTION = "Technology Detection (WhatWeb)",
  BASIC_HEADER_SCAN = "Basic Header Scan (Simulated)"
}

export enum ScanProfile {
  QUICK = "Quick Scan",
  FULL = "Full Scan",
  CUSTOM = "Custom Configuration"
}

export interface Scan {
  id: string;
  targetUrl: string;
  scanDate: string; // ISO string
  overallRating: ScanRating;
  status: "Completed" | "In Progress" | "Failed" | "Queued";
  vulnerabilities: Vulnerability[];
  aiSummary?: string;
  remediationSuggestions?: string[]; // General suggestions
  toolOutput?: Record<string, any>; // Raw output from scanning tools
  toolsUsed?: AvailableScanTools[]; // List of tools selected for this scan
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export type Theme = 'light' | 'dark';

export enum SortDirection {
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  NONE = 'none',
}

export type SortableScanKeys = 'id' | 'targetUrl' | 'scanDate' | 'overallRating';

export interface SortConfig {
  key: SortableScanKeys;
  direction: SortDirection;
}

// Settings structure
export interface DashboardSettings {
  defaultSortKey: SortableScanKeys;
  defaultSortDirection: SortDirection;
  itemsPerPage: 10 | 25 | 50; // Example
}

export interface ToolSpecificConfig {
  endpoint?: string;
  apiKeyPlaceholder?: string;
}

export interface ToolSettings {
  enabledTools: Record<AvailableScanTools, boolean>;
  toolSpecificConfigs: Record<AvailableScanTools, ToolSpecificConfig>;
}

export interface APISettings {
  geminiAIEnabled: boolean; // Simulates backend status
  geminiAPIKeyPlaceholder: string; // For illustrative input only
  osvApiKeyPlaceholder: string; // For illustrative input only
}

export interface AppSettings {
  theme: Theme;
  dashboard: DashboardSettings;
  tools: ToolSettings;
  apis: APISettings;
}

// New Types for Overview and Toasts
export type AppView = 'overview' | 'dashboard';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
