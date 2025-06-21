#!/bin/bash

# Update vulnerability feeds
echo "Updating vulnerability feeds..."
curl -o /data/feeds/cve/nvdcve-1.1-modified.json https://nvd.nist.gov/vuln/data-feeds/JSON/1.1/nvdcve-1.1-modified.json
curl -o /data/feeds/epss/epss_scores-$(date +%Y-%m-%d).csv.gz https://epss.cyentia.com/epss_scores-current.csv.gz
curl -o /data/feeds/kev/kev_catalog.csv https://www.cisa.gov/sites/default/files/csv/known_exploited_vulnerabilities.csv

# Launch Flask application
echo "Launching Flask application..."
python3 /app/app.py 