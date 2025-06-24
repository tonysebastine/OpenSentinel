
# OpenSentinel Dashboard: Future Integration Guide

This document outlines the necessary backend development and integration steps to transform the OpenSentinel Dashboard from a UI prototype with mock data into a fully functional web-based pentesting platform.

## Table of Contents
1.  [Core Backend Requirements](#core-backend-requirements)
2.  [Real-time Scan Execution & Tool Integration](#real-time-scan-execution--tool-integration)
    *   [2.1 Basic Website Reconnaissance & Header Scan Implementation](#21-basic-website-reconnaissance--header-scan-implementation)
3.  [AI-Powered Analysis (Gemini Integration)](#ai-powered-analysis-gemini-integration)
4.  [Vulnerability Status Management & Notes](#vulnerability-status-management--notes)
5.  [Scan Profiles Management](#scan-profiles-management)
6.  [Report Generation (CSV/PDF)](#report-generation-csvpdf)
7.  [User Authentication & Authorization](#user-authentication--authorization)
8.  [Application Configuration & Settings Management](#application-configuration--settings-management)

## 1. Core Backend Requirements

Before specific features can be implemented, a robust backend foundation is needed:

*   **Programming Language/Framework:** Choose a suitable backend language and framework (e.g., Python with Flask/Django, Node.js with Express). The original project description mentioned a Node.js/Express API backend.
*   **Database:**
    *   **MongoDB:** Good for flexible schema, storing diverse tool outputs, and scan results (as per original project description).
    *   **PostgreSQL:** Alternatively, a relational database can be used if structured data and ACID compliance are prioritized.
    *   Define schemas for `Scans`, `Vulnerabilities`, `Users`, `ScanProfiles`, `AppSettings` etc.
*   **Job Queue System:** (e.g., Redis + BullMQ, Celery with RabbitMQ/Redis - as per original project description)
    *   Essential for managing long-running scanning tasks asynchronously without blocking API requests.
*   **API Design:** A RESTful or GraphQL API to communicate between the frontend and backend.
*   **Configuration Management:** Securely manage API keys (Gemini, etc.), database credentials, and other sensitive settings. **Environment variables are highly recommended.**
*   **Logging:** Implement comprehensive logging for debugging and auditing.

## 2. Real-time Scan Execution & Tool Integration

This is the core of the pentesting platform.

*   **Current Frontend:**
    *   Allows users to input a target URL.
    *   Allows users to select a "Scan Profile" (Quick, Full) which pre-selects tools, or "Custom" to manually select tools like Port Scan, Nuclei, OWASP ZAP, etc., including a simulated "Basic Header Scan". Tools available in the modal are filtered by `AppSettings`.
    *   Sends the target URL and an array of selected `AvailableScanTools` to a (currently simulated) `handleStartScan` function.

*   **Required Backend Functionality:**

    *   **API Endpoint:** `POST /api/scans`
        *   **Request Body:** `{ "targetUrl": "string", "tools": ["AvailableScanToolEnum", ...], "profile": "ScanProfileEnum" }`
        *   **Response:** Scan object with an initial `id` and `status: "Queued"` or `status: "Accepted"`.

    *   **Backend Logic (API Handler):**
        1.  Validate input (target URL format, tool validity).
        2.  Create a new scan record in the database with `status: "Queued"`, `targetUrl`, `toolsUsed`, `profile`, `scanDate`, etc.
        3.  Enqueue a new job in the job queue system, passing the `scanId` and necessary parameters (target URL, selected tools, user-specific tool settings if applicable from backend config).
        4.  Return the initial scan object (or just the `scanId`) to the frontend.

    *   **Backend Logic (Job Worker):**
        1.  Dequeue a scan job.
        2.  Update the scan record in the database to `status: "In Progress"`.
        3.  **Tool Orchestration:** For each tool in `toolsUsed`:
            *   **Environment Setup:** Ensure the scanning tool is installed and accessible in the worker's environment (e.g., within a Docker container, or on the host system).
            *   **Command Construction:** Dynamically build the command-line arguments for the tool. Use backend-configured parameters/API keys for specific tools if needed (see Section 8 for how the backend uses its own secure configurations).
                *   Example (`NUCLEI_SCAN`): `nuclei -u {targetUrl} -t community,cves -json -o /tmp/scan_{scanId}_nuclei.json`
                *   Example (`PORT_SCAN` with Nmap): `nmap -sV -p- {targetUrl} -oX /tmp/scan_{scanId}_nmap.xml`
                *   Consider using specific templates or configurations based on the selected profile (e.g., "Quick Scan" might use fewer Nuclei templates).
            *   **Execution:** Execute the tool as a subprocess.
                *   Capture `stdout`, `stderr`, and exit codes.
                *   Implement timeouts to prevent runaway scans.
                *   Consider security implications (sandboxing tool execution if possible, especially for tools that interact heavily with targets).
            *   **Output Parsing:**
                *   Each tool produces output in a different format (JSON, XML, plain text). Write parsers for each supported tool to extract relevant information (found vulnerabilities, open ports, service versions, etc.) into a standardized `Vulnerability` structure (as defined in `types.ts`).
                *   Map tool-specific severity levels to the application's `ScanRating` enum.
                *   Store raw tool output if needed for detailed analysis (`toolOutput` field in `Scan` type).
        4.  **Result Consolidation:** Aggregate vulnerabilities from all executed tools. De-duplicate findings if multiple tools report the same issue (this can be complex).
        5.  **Update Scan Record:**
            *   Store all found `Vulnerability` objects, linking them to the `scanId`.
            *   Update the main scan record's `status` to `"Completed"` (or `"Failed"` if critical errors occurred).
            *   Calculate and store the `overallRating` based on the consolidated vulnerabilities.
            *   Store `aiSummary: undefined` initially.

    *   **API Endpoints (for Frontend Polling/Updates):**
        *   `GET /api/scans/{scanId}`: Fetch the current status and details of a scan.
        *   `GET /api/scans`: List all scans (with pagination and filtering capabilities, potentially respecting `itemsPerPage` from user settings).

    *   **Frontend Updates:**
        *   The frontend can periodically poll `GET /api/scans/{scanId}` to update the display status or use WebSockets for real-time updates from the backend.

### 2.1 Basic Website Reconnaissance & Header Scan Implementation

*   **Current Frontend:** If "Basic Header Scan" is selected, the frontend simulates finding common headers and basic website information with dynamically varied but mock values. The evidence shown is quite detailed in its simulation.

*   **Required Backend Functionality (Job Worker for `BASIC_HEADER_SCAN` or a dedicated "Website Reconnaissance" tool):**
    1.  **HTTP Request & Basic Info:** The backend worker should make an HTTP `GET` request to the `targetUrl` (and potentially to `targetUrl/robots.txt`). Server-side requests are not limited by CORS.
        *   Use a robust HTTP client library (e.g., `axios`, `requests`).
        *   Handle redirects, timeouts, and SSL/TLS errors gracefully.
        *   Attempt to resolve the target URL to an IP address.
        *   Extract `Server` and `X-Powered-By` headers to identify web server software and underlying technologies.
        *   Parse `robots.txt` if found, noting key `Allow`/`Disallow` directives.
        *   Attempt basic CMS detection (e.g., looking for common paths, meta tags, or using specialized libraries like `Wappalyzer` or its equivalents).
    2.  **HTTP Security Header Extraction & Analysis:**
        *   Access all response headers.
        *   Identify and analyze common security headers:
            *   `Content-Security-Policy` (CSP): Check for presence and basic directives (e.g., `default-src`, `script-src`).
            *   `Strict-Transport-Security` (HSTS): Check for presence and `max-age`.
            *   `X-Frame-Options`: Check for presence and value (e.g., `DENY`, `SAMEORIGIN`).
            *   `X-Content-Type-Options`: Check for `nosniff`.
            *   `Referrer-Policy`: Check for presence and value.
            *   `Permissions-Policy` (formerly Feature-Policy): Check for presence and restrictive directives.
            *   Others like `X-XSS-Protection` (though largely deprecated in favor of CSP).
    3.  **Cookie Analysis:**
        *   Inspect `Set-Cookie` headers from the response.
        *   For each cookie, analyze attributes: `HttpOnly`, `Secure`, `SameSite` (Lax, Strict, None), `Path`, `Domain`, `Expires`/`Max-Age`.
    4.  **Vulnerability/Finding Creation:** Create `Vulnerability` objects based on the findings, categorized appropriately. The structure should aim to provide the rich detail currently simulated by the frontend:
        *   **General Information (Informational):**
            *   Name: "Website Reconnaissance Overview"
            *   Severity: `ScanRating.INFORMATIONAL`
            *   Description: "Summary of basic website information, server details, and detected technologies."
            *   Evidence: A formatted string listing: Target IP, Web Server, X-Powered-By, Detected CMS, Robots.txt summary.
        *   **HTTP Header Findings (Informational to Medium):**
            *   Name: "HTTP Security Header Analysis"
            *   Severity: `ScanRating.INFORMATIONAL` (can be elevated to `LOW` or `MEDIUM` if critical headers like CSP/HSTS are missing or badly misconfigured).
            *   Description: "Assessment of HTTP security header configurations."
            *   Evidence: Detailed list of each checked security header, its value (or "Missing"), and a brief commentary on its configuration status (e.g., "Content-Security-Policy: Missing - Critical for XSS protection.").
        *   **Cookie Security Findings (Informational to Medium):**
            *   Name: "Cookie Security Analysis"
            *   Severity: `ScanRating.INFORMATIONAL` (elevate if sensitive cookies lack `HttpOnly` or `Secure` flags).
            *   Description: "Review of cookie attributes for security best practices."
            *   Evidence: List of cookies and their attributes, highlighting any insecure configurations.
        *   **Specific Misconfigurations (Low to Medium):**
            *   If `X-Powered-By` reveals detailed version info: Name "X-Powered-By Header Exposes Technology Version", Severity `ScanRating.LOW`.
            *   If `Server` header reveals detailed version info: Name "Server Header Exposes Version", Severity `ScanRating.LOW`.
    5.  These `Vulnerability` objects are then added to the scan's results like any other tool's output.

## 3. AI-Powered Analysis (Gemini Integration)

*   **Current Frontend:**
    *   `ScanDetailView` has a button "Generate AI Summary & Insights".
    *   `geminiService.ts` now simulates calling a backend API for the summary.

*   **Required Backend Functionality:**

    *   **Security First:** The Google Gemini API key **MUST** be stored securely on the backend (e.g., environment variable, secrets manager) and **NEVER** exposed to the frontend. This status is reflected conceptually in `AppSettings.apis.geminiAIEnabled`.

    *   **API Endpoint:** `POST /api/scans/{scanId}/ai-summary`
        *   **Request Body:** (Potentially empty, or could include specific user prompts/context if needed later)
        *   **Response:** `{ summary: string, remediationTips: string[], keyFindings: string[], sources?: GroundingSource[] }`

    *   **Backend Logic (API Handler):**
        1.  Check if Gemini AI features are enabled in the backend configuration (this is the true source for `AppSettings.apis.geminiAIEnabled`). If not, return an appropriate message. The backend uses its own internal flag for this, not a value passed from the frontend.
        2.  Retrieve the specified `scan` record and its associated `vulnerabilities` from the database.
        3.  If no vulnerabilities, return a pre-defined "no vulnerabilities found" message.
        4.  Construct the prompt for the Gemini API using the scan data.
        5.  Initialize the Gemini SDK (`GoogleGenAI`) on the backend using the securely stored API key.
        6.  Make the `ai.models.generateContent` call to the Gemini API.
            *   Include `tools: [{ googleSearch: {} }]` if grounding is desired.
            *   **Do not** use `responseMimeType: "application/json"` with tools. Parse the JSON from the text response.
        7.  Parse the Gemini API response text to extract the JSON payload for summary, key findings, and remediation tips. Extract grounding sources if available.
        8.  Store the generated `summary`, `remediationTips`, `keyFindings`, and `sources` back into the corresponding `scan` record in the database.
        9.  Return the generated data to the frontend.

    *   **Frontend Update:**
        *   `geminiService.ts` simulates a `fetch` request to `POST /api/scans/{scanId}/ai-summary`.
        *   The AI summary generation button in `ScanDetailView` could be disabled if `appSettings.apis.geminiAIEnabled` (fetched from backend or simulated as enabled in backend config) is false.

## 4. Vulnerability Status Management & Notes

*   **Current Frontend:**
    *   `VulnerabilityCard` in `ScanDetailView` allows users to select a new status and edit/add notes.
    *   Changes are handled by `onUpdateVulnerabilityStatus` and `onUpdateVulnerabilityNotes` props, updating local frontend state.

*   **Required Backend Functionality:**

    *   **Database Schema:**
        *   Ensure the `Vulnerabilities` table/collection has `status` (enum/string) and `notes` (text) fields.

    *   **API Endpoints:**
        *   `PUT /api/scans/{scanId}/vulnerabilities/{vulnerabilityId}/status`
            *   **Request Body:** `{ "status": "VulnerabilityStatusEnum" }`
        *   `PUT /api/scans/{scanId}/vulnerabilities/{vulnerabilityId}/notes`
            *   **Request Body:** `{ "notes": "string" }`

    *   **Backend Logic (API Handlers):**
        1.  Validate `scanId` and `vulnerabilityId`.
        2.  Authorize the user.
        3.  Update the `status` or `notes` field for the specified vulnerability in the database.
        4.  Recalculate and update the parent scan's `overallRating`.
        5.  Return a success response.

    *   **Frontend Updates:**
        *   Modify `handleUpdateVulnerabilityStatus` and `handleUpdateVulnerabilityNotes` in `App.tsx` to make API calls, then update local state on success.

## 5. Scan Profiles Management

*   **Current Frontend:**
    *   `NewScanModal` has a "Scan Profile" dropdown. `Quick` and `Full` profiles pre-select tools. `Custom` allows manual selection.

*   **Required Backend Functionality (for user-defined profiles):**

    *   **Database Schema:**
        *   A new table/collection for `ScanProfiles` (`profileId`, `userId`, `name`, `description`, `selectedTools: AvailableScanToolEnum[]`).

    *   **API Endpoints:**
        *   `GET /api/scan-profiles`: List available scan profiles (user-defined and defaults).
        *   `POST /api/scan-profiles`: Create a new custom scan profile.
        *   `PUT /api/scan-profiles/{profileId}`: Update a custom scan profile.
        *   `DELETE /api/scan-profiles/{profileId}`: Delete a custom scan profile.

    *   **Backend Logic:**
        *   CRUD for scan profiles, ensuring user ownership.
        *   When starting a scan (`POST /api/scans`): if a `profileId` is provided, the backend retrieves the toolset from the profile.

    *   **Frontend Updates:**
        *   `NewScanModal`: Fetch profiles for the dropdown.
        *   (Optional) UI for managing custom scan profiles.

## 6. Report Generation (CSV/PDF)

*   **Current Frontend:** Buttons exist but are conceptual.

*   **Required Backend Functionality:**

    *   **API Endpoints:**
        *   `GET /api/scans/{scanId}/report?format=csv`
        *   `GET /api/scans/{scanId}/report?format=pdf`

    *   **Backend Logic:**
        *   Retrieve scan data.
        *   Use libraries (e.g., `csv-writer`, `PDFKit`/`Puppeteer`) to generate files.
        *   Stream files in HTTP response.

    *   **Frontend Updates:**
        *   `onClick` handlers open the API endpoint URL: `window.open(\`/api/scans/${scan.id}/report?format=csv\`, '_blank');`

## 7. User Authentication & Authorization

*   **Original Plan:** Supabase, Keycloak, or Auth0.
*   **Integration Points:**
    *   **Backend:** Protect APIs, associate data with users, RBAC.
    *   **Frontend:** Login/Registration UI, token management, conditional UI based on roles.

## 8. Application Configuration & Settings Management

*   **Current Frontend:** `SettingsModal` provides UI for theme, conceptual dashboard settings (items per page, default sort), tool visibility in New Scan modal, and illustrative inputs for API keys and tool configurations. Settings are saved in `localStorage`.

*   **Required Backend Functionality & Clarifications:**

    *   **Master Control Resides on Backend:**
        *   **API Keys (Gemini, OSV.dev, etc.):** These are **exclusively** configured and stored on the backend server using environment variables or a secure secrets management service (e.g., HashiCorp Vault, AWS Secrets Manager). **The frontend NEVER handles, stores, or updates real API keys.** The input fields in the frontend's Settings modal for API keys are purely illustrative placeholders to visually represent where such a configuration *might* be set on a backend.
        *   **Tool-Specific Parameters & Endpoints:** If scanning tools require specific backend configurations (e.g., a URL for an internal ZAP API, an API key for a commercial tool integrated into the backend), these are also managed **exclusively** on the backend server, typically through environment variables or configuration files. The "Conceptual Backend Endpoint" and "Conceptual Tool API Key" fields in the frontend's Settings modal are for visualization and understanding how a backend might be structured; they do not directly configure the backend.
        *   **Feature Enablement (e.g., AI Features):** Whether a feature like Gemini AI is truly available is determined by the backend's configuration (e.g., if the `GEMINI_API_KEY` environment variable is set on the server). The frontend toggle for "Gemini AI Enabled" is a simulation; its true state should ideally be fetched from the backend.

    *   **Backend Configuration Storage & Access:**
        *   The backend reads its secure configurations (API keys, tool parameters) from its environment or a secure store at startup.
        *   When a scan job is processed, the backend worker uses its **own securely stored configurations** for tools. It does not rely on any API key or sensitive endpoint information passed from the frontend or stored in the frontend's `localStorage`.

    *   **Frontend Settings (from `localStorage` and `AppSettings`):**
        *   **Theme, Dashboard Preferences (Sort, Items Per Page):** These are UI/UX preferences and are suitable for `localStorage`. The backend typically doesn't need to know about these unless you implement server-side persistence of user preferences.
        *   **`AppSettings.tools.enabledTools`:** This should be interpreted as the *user's preference for which tools are visible and pre-selected in the New Scan modal on the frontend*. The backend will still validate if it *can* run the requested tools based on its own master configuration.
        *   **`AppSettings.tools.toolSpecificConfigs` (placeholders):** These are purely illustrative on the frontend. A backend would have its own secure way of configuring, for example, the Nmap command flags or the ZAP API endpoint.
        *   **`AppSettings.apis.geminiAPIKeyPlaceholder`, `osvApiKeyPlaceholder`:** These are visual placeholders in the UI. **They do not represent or store actual API keys.**

    *   **API Endpoint for Frontend Configuration (Optional but Recommended):**
        *   `GET /api/config/ui` (or similar)
        *   **Response:** An object containing non-sensitive configuration data the frontend might need to correctly render UI elements or inform the user about available features.
            *   Example: `{ "aiFeaturesActuallyEnabled": true/false, "availableToolsList": ["NUCLEI_SCAN", "PORT_SCAN"], "maxAllowedScanTargetsPerUser": 10 }`
        *   The frontend would use this data to, for example, accurately disable the "Generate AI Summary" button if `aiFeaturesActuallyEnabled` is false, or to populate the list of truly available tools in the `NewScanModal` if the backend has a master list.

    *   **Frontend Updates Based on Backend Reality:**
        *   On application load, the frontend could fetch initial configuration from `GET /api/config/ui`.
        *   The "API Keys" tab in `SettingsModal` should primarily reflect the status fetched from this backend config endpoint (e.g., if `aiFeaturesActuallyEnabled` is false, the Gemini section should clearly indicate it's unavailable due to backend configuration).
        *   The "Simulate Key Update" buttons in the frontend are for demonstration only and would be removed in a production system, or they would trigger an administrative action on the backend that requires proper authorization (and is still not about directly setting the key via the frontend).

This guide provides a roadmap for evolving OpenSentinel. Each section represents a significant development effort. Prioritize based on the most critical functionalities for your users.
