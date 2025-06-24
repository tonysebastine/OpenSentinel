
import { Scan, ScanRating, Vulnerability, AvailableScanTools, VulnerabilityStatus, ScanProfile } from './types';

export const RATING_COLORS: Record<ScanRating, string> = {
  [ScanRating.CRITICAL]: "bg-red-600 text-red-100",
  [ScanRating.HIGH]: "bg-orange-500 text-orange-100",
  [ScanRating.MEDIUM]: "bg-yellow-500 text-yellow-900",
  [ScanRating.LOW]: "bg-blue-500 text-blue-100",
  [ScanRating.INFORMATIONAL]: "bg-gray-500 text-gray-100",
  [ScanRating.NONE]: "bg-green-500 text-green-100",
};

export const RATING_TEXT_COLORS: Record<ScanRating, string> = {
  [ScanRating.CRITICAL]: "text-red-500",
  [ScanRating.HIGH]: "text-orange-400",
  [ScanRating.MEDIUM]: "text-yellow-400",
  [ScanRating.LOW]: "text-blue-400",
  [ScanRating.INFORMATIONAL]: "text-gray-400",
  [ScanRating.NONE]: "text-green-400",
};

export const VULNERABILITY_STATUS_CONFIG: Record<VulnerabilityStatus, { label: string, color: string, textColor: string }> = {
  [VulnerabilityStatus.OPEN]: { label: "Open", color: "bg-red-500", textColor: "text-red-100" },
  [VulnerabilityStatus.ACKNOWLEDGED]: { label: "Acknowledged", color: "bg-yellow-500", textColor: "text-yellow-900" },
  [VulnerabilityStatus.FALSE_POSITIVE]: { label: "False Positive", color: "bg-green-500", textColor: "text-green-100" },
  [VulnerabilityStatus.FIXED]: { label: "Fixed", color: "bg-blue-500", textColor: "text-blue-100" },
};

export const SCAN_TOOLS_CONFIG: { id: AvailableScanTools, label: string, description: string }[] = [
  { id: AvailableScanTools.BASIC_HEADER_SCAN, label: "Basic Header Scan", description: "Checks for common HTTP security headers (simulated frontend check)." },
  { id: AvailableScanTools.PORT_SCAN, label: "Port Scan", description: "Discover open ports and services (simulates Nmap/httpx)." },
  { id: AvailableScanTools.NUCLEI_SCAN, label: "Nuclei Scan", description: "Run template-based vulnerability scanning with Nuclei." },
  { id: AvailableScanTools.OWASP_ZAP_ACTIVE, label: "OWASP ZAP Active Scan", description: "Perform active security scanning with OWASP ZAP." },
  { id: AvailableScanTools.SUBDOMAIN_ENUM, label: "Subdomain Enumeration", description: "Find subdomains using tools like Subfinder or Amass." },
  { id: AvailableScanTools.DIR_FUZZING, label: "Directory Fuzzing", description: "Discover hidden directories and files (Dirsearch/Gobuster)." },
  { id: AvailableScanTools.TECH_DETECTION, label: "Technology Detection", description: "Identify web technologies using WhatWeb." },
];

export const SCAN_PROFILES_CONFIG: Record<Exclude<ScanProfile, ScanProfile.CUSTOM>, AvailableScanTools[]> = {
  [ScanProfile.QUICK]: [
    AvailableScanTools.BASIC_HEADER_SCAN, // Added here
    AvailableScanTools.PORT_SCAN, 
    AvailableScanTools.NUCLEI_SCAN, 
    AvailableScanTools.TECH_DETECTION
  ],
  [ScanProfile.FULL]: [
    AvailableScanTools.BASIC_HEADER_SCAN, // Added here
    AvailableScanTools.PORT_SCAN, 
    AvailableScanTools.NUCLEI_SCAN, 
    AvailableScanTools.OWASP_ZAP_ACTIVE, 
    AvailableScanTools.SUBDOMAIN_ENUM, 
    AvailableScanTools.DIR_FUZZING,
    AvailableScanTools.TECH_DETECTION
  ],
};


export const MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: "vuln-001",
    cveId: "CVE-2023-1234",
    name: "SQL Injection",
    description: "A SQL injection vulnerability allows attackers to execute arbitrary SQL queries on the database.",
    severity: ScanRating.CRITICAL,
    status: VulnerabilityStatus.OPEN,
    cvssScore: 9.8,
    epssScore: 0.95,
    isKev: true,
    remediation: "Use parameterized queries or prepared statements. Validate and sanitize all user inputs.",
    evidence: "POST /api/login with payload ' OR 1=1 --",
    notes: "Needs immediate patching. Confirmed via manual test.",
  },
  {
    id: "vuln-002",
    cveId: "CVE-2023-5678",
    name: "Cross-Site Scripting (XSS)",
    description: "Reflected XSS on search page allows arbitrary JavaScript execution in user's browser.",
    severity: ScanRating.HIGH,
    status: VulnerabilityStatus.OPEN,
    cvssScore: 7.5,
    epssScore: 0.60,
    remediation: "Encode output data. Implement Content Security Policy (CSP).",
    evidence: "GET /search?q=<script>alert(1)</script>"
  },
  {
    id: "vuln-003",
    name: "Outdated Server Software",
    description: "The web server is running an outdated version of Apache with known vulnerabilities.",
    severity: ScanRating.MEDIUM,
    status: VulnerabilityStatus.ACKNOWLEDGED,
    cveId: "CVE-2022-9876",
    cvssScore: 5.3,
    remediation: "Update Apache to the latest stable version.",
    notes: "Scheduled for update next maintenance window.",
  },
  {
    id: "vuln-004",
    name: "Missing Security Headers",
    description: "Important security headers like X-Content-Type-Options are missing.",
    severity: ScanRating.LOW,
    status: VulnerabilityStatus.FIXED,
    remediation: "Configure web server to add appropriate security headers (e.g., X-Content-Type-Options, Strict-Transport-Security).",
  },
  {
    id: "vuln-005",
    name: "Directory Listing Enabled",
    description: "Directory listing is enabled on /assets/, potentially exposing sensitive file structure.",
    severity: ScanRating.INFORMATIONAL,
    status: VulnerabilityStatus.FALSE_POSITIVE,
    remediation: "Disable directory listing in web server configuration.",
    notes: "This is intentional for a public assets directory."
  }
];

export const MOCK_SCANS: Scan[] = [
  {
    id: "scan-001",
    targetUrl: "https://example.com",
    scanDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    overallRating: ScanRating.HIGH,
    status: "Completed",
    vulnerabilities: MOCK_VULNERABILITIES.slice(0, 3).map(v => ({...v, id: `scan-001-${v.id.replace(/^vuln-/, '')}`})),
    aiSummary: "The scan identified three vulnerabilities, including a high-severity Cross-Site Scripting (XSS) issue. Immediate attention is recommended for the XSS flaw found on the search page. Additionally, outdated server software poses a medium risk.",
    toolsUsed: [AvailableScanTools.NUCLEI_SCAN, AvailableScanTools.PORT_SCAN],
  },
  {
    id: "scan-002",
    targetUrl: "https://test-webapp.org",
    scanDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    overallRating: ScanRating.CRITICAL,
    status: "Completed",
    vulnerabilities: MOCK_VULNERABILITIES.map(v => ({...v, id: `scan-002-${v.id.replace(/^vuln-/, '')}`})),
    aiSummary: undefined, // To be generated
    toolsUsed: [AvailableScanTools.OWASP_ZAP_ACTIVE, AvailableScanTools.NUCLEI_SCAN, AvailableScanTools.SUBDOMAIN_ENUM],
  },
  {
    id: "scan-003",
    targetUrl: "https://another-site.net",
    scanDate: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    overallRating: ScanRating.LOW,
    status: "Completed",
    vulnerabilities: [MOCK_VULNERABILITIES[3], MOCK_VULNERABILITIES[4]].map(v => ({...v, id: `scan-003-${v.id.replace(/^vuln-/, '')}`})),
    toolsUsed: [AvailableScanTools.TECH_DETECTION],
  },
  {
    id: "scan-004",
    targetUrl: "https://dev.internal-service.local",
    scanDate: new Date().toISOString(),
    overallRating: ScanRating.NONE,
    status: "In Progress",
    vulnerabilities: [],
  },
  {
    id: "scan-005",
    targetUrl: "https://corporate-portal.com",
    scanDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    overallRating: ScanRating.MEDIUM,
    status: "Completed",
    vulnerabilities: [MOCK_VULNERABILITIES[2], MOCK_VULNERABILITIES[3]].map(v => ({...v, id: `scan-005-${v.id.replace(/^vuln-/, '')}`})),
    toolsUsed: [AvailableScanTools.PORT_SCAN, AvailableScanTools.DIR_FUZZING],
  }
];
