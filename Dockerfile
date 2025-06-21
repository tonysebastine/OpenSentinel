# syntax=docker/dockerfile:1.4

# Stage 1: Build dependencies
FROM --platform=$BUILDPLATFORM python:3.10-alpine AS builder

WORKDIR /code

# Install build dependencies and cache pip files for efficiency
COPY requirements.txt /code
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install --prefix=/install -r requirements.txt

COPY . /code

# Stage 2: Final image
FROM python:3.10-alpine

WORKDIR /app

# Copy application files and installed dependencies
COPY --from=builder /install /usr/local
COPY . /app

# Set environment variables
ENV GEMINI_API_KEY=""
ENV OPENROUTER_API_KEY=""
ENV TOGETHERAI_API_KEY=""

# Expose port
EXPOSE 3000

# Add entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
CMD ["/entrypoint.sh"] 