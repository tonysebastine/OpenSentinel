import { Scan, Vulnerability, GroundingSource } from '../types';

// This service now simulates fetching AI-generated insights from a backend.
// The actual Gemini API calls, API key management, and prompt engineering
// would happen on the backend, as detailed in FUTURE_INTEGRATION_GUIDE.md.

interface AISummaryResponse {
  summary: string;
  remediation_tips: string[];
  key_findings: string[];
  sources?: GroundingSource[];
}

export const generateScanSummaryAndInsights = async (
  scan: Scan
): Promise<{ summary: string; remediationTips: string[]; keyFindings: string[]; sources?: GroundingSource[] }> => {
  // Simulate an API call to a backend endpoint
  // e.g., return fetch(`/api/scans/${scan.id}/ai-summary`, { method: 'POST' }).then(res => res.json());

  console.log(`Simulating AI summary generation for scan ID: ${scan.id}. In a real system, this would call a backend API.`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  if (scan.vulnerabilities.length === 0) {
    return {
      summary: "No vulnerabilities were found in this scan. The target appears to be secure based on the performed checks (simulated backend response).",
      remediationTips: [],
      keyFindings: ["No vulnerabilities detected (simulated)."],
      sources: []
    };
  }

  // Mocked backend response structure
  const mockAISummary: AISummaryResponse = {
    summary: `This is a simulated AI summary for ${scan.targetUrl}. It highlights key findings based on the vulnerabilities detected. For instance, ${scan.vulnerabilities[0]?.name || 'a specific vulnerability'} was noted. Further analysis would typically be provided by the backend AI service.`,
    key_findings: scan.vulnerabilities.slice(0, 2).map(v => `${v.severity} - ${v.name} (simulated finding)`),
    remediation_tips: [
      "Ensure all software components are up to date (simulated tip).",
      "Implement strong input validation and output encoding (simulated tip).",
      "Regularly review security configurations (simulated tip)."
    ],
    sources: scan.id.includes("001") ? // Simulate sources for a specific scan for variety
      [
        { uri: "https://owasp.org/www-project-top-ten/", title: "OWASP Top Ten (Simulated Source)"},
        { uri: "https://cve.mitre.org/", title: "CVE Database (Simulated Source)" }
      ] 
      : undefined
  };
  
  // Simulate a potential error for demonstration if needed.
  // if (Math.random() < 0.1) { // 10% chance of error
  //   throw new Error("Simulated backend error: AI service unavailable.");
  // }

  return {
    summary: mockAISummary.summary,
    remediationTips: mockAISummary.remediation_tips,
    keyFindings: mockAISummary.key_findings,
    sources: mockAISummary.sources
  };
};