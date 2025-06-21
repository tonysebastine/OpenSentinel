#!/bin/sh

# Custom scanning script that combines multiple tools
# Usage: ./scan.sh <target>

TARGET=$1
OUTPUT_DIR="/data/$(date +%Y%m%d_%H%M%S)"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Starting comprehensive scan of $TARGET"
echo "Results will be saved to $OUTPUT_DIR"

# Run Nmap scan
echo "Running Nmap scan..."
nmap -sV -sC -A "$TARGET" -oN "$OUTPUT_DIR/nmap_results.txt"

# Run Gobuster scan
echo "Running Gobuster scan..."
gobuster dir -u "http://$TARGET" -w /usr/share/wordlists/dirb/common.txt -o "$OUTPUT_DIR/gobuster_results.txt"

# Run Nikto scan
echo "Running Nikto scan..."
nikto -h "http://$TARGET" -output "$OUTPUT_DIR/nikto_results.txt"

echo "Scan complete. Results saved to $OUTPUT_DIR"
