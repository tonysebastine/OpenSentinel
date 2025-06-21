FROM debian:12-slim

# Install system dependencies
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nodejs \
    npm \
    git \
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
WORKDIR /app
COPY ./app/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app .

# Expose default port
EXPOSE 8000

# Start the application
CMD ["python3", "main.py"]
