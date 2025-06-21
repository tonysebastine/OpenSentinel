FROM debian:12-slim

# Install security tools and dependencies
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    nmap \
    metasploit-framework \
    gobuster \
    masscan \
    nikto \
    sqlmap \
    hydra \
    curl \
    wget \
    dnsutils \
    openssh-client \
    python3 \
    python3-pip \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create tools directory
WORKDIR /tools

# Copy custom scripts and tools
COPY scripts/ /tools/scripts/

# Make scripts executable
RUN chmod +x /tools/scripts/*

# Create data directory for scan results
RUN mkdir -p /data

# Set environment variables
ENV TOOLS_DIR=/tools
ENV DATA_DIR=/data

# Keep container running
CMD ["tail", "-f", "/dev/null"]
