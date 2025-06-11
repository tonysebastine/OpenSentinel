# 🛡️ OpenSentinel

**OpenSentinel** is a powerful, fully free and open-source web-based pentesting platform. Designed for ethical hackers, developers, and security enthusiasts, it automates advanced scanning, vulnerability detection, and report generation using a hybrid of open-source tools and modern cloud integrations.

---

## 🚀 Features

* 🌐 Web UI (Next.js frontend)
* ⚙️ Node.js/Express API backend
* 🧠 AI-assisted reports via Google Gemini (free tier)
* 🔍 Advanced scanning with:

  * `nmap`
  * `OWASP ZAP`
  * `OSV.dev` API for CVE lookups
  * Optional: `Nikto`, `SQLMap`, `Wapiti`
* 🧪 Fuzzing and anomaly detection (custom plugin support)
* 🗃️ MongoDB for scan data
* 🔐 Supabase (self-hosted) for auth and metadata
* 🔄 Job Queue system using Redis + BullMQ
* 📦 Lightweight with Alpine-based Docker images
* 📊 Optional integration with Grafana, Loki, ELK

---

## 🏗️ Architecture

```
[ Next.js Frontend ] ↔ [ Node.js API ] ↔ [ Worker Queue (BullMQ + Redis) ]
                                  ↳ [ Python Scanner Service ]
                                  ↳ [ AI Report Generator ]
                                  ↳ [ MongoDB + Supabase Postgres ]
```

---

## 🐳 Docker Setup

### API (`./api/Dockerfile`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Scanner Service (`./scanner/Dockerfile`)

```dockerfile
FROM python:3.11-alpine
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "scanner_service:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 🧠 AI Integration

* Uses Google Gemini (via remote API)
* Free-tier enabled (auto summarization, CVSS scoring)
* Rate-limited and quota-friendly

---

## ☁️ Deployments

### Vercel (Frontend only)

`vercel.json`

```json
{
  "version": 2,
  "builds": [
    { "src": "next.config.js", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Fly.io (Backend)

`fly.toml`

```toml
app = "opensentinel"
[build]
  image = "your-image-name:latest"
[env]
  NODE_ENV = "production"
[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]
```

---

## 🧪 Plugin System (Coming Soon)

Drop-in scanner plugins:

* Python or Bash based
* Auto-discovery via manifest (`plugin.yaml`)
* Enable your own tools like `ffuf`, `nuclei`, `custom payload scripts`

---

## 📦 Requirements

* Docker & Docker Compose
* Free-tier Google API key for Gemini
* GitHub account for CI/CD (optional)
* Redis (for queue)
* MongoDB Atlas or self-hosted
* Supabase (can self-host or use free tier)

---

## 🛡️ Security & Hardening

* LLM API rate limiting
* Auth via Supabase + JWT
* Dependency scanning via `npm audit`, `pip-audit`, `trivy`
* Sandbox OWASP ZAP and others via Docker

---

## 💡 Roadmap

* [ ] Auto-scan scheduling
* [ ] Multi-user dashboards
* [ ] PDF report export
* [ ] CVE database mirror
* [ ] AI-assisted remediation suggestions

---

## 📜 License

OpenSentinel is licensed under the MIT License. Contributions welcome!

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR
4. ⭐ Star the project if you find it useful!

---

## ✨ Name Meaning

> **OpenSentinel** = Open-source + Sentinel (a watcher/guardian)

Keeping your services secure — one scan at a time.

---

## 📫 Contact

* GitHub Issues for bugs/feature requests
* Discord/Matrix/IRC (coming soon!)

---

Let me know if you’d like this turned into a working repo template with CI/CD integration!
