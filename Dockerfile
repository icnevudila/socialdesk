FROM node:20-slim

# Install Python and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create Python virtual environment and install instagrapi
RUN python3 -m venv .venv && \
    ./.venv/bin/pip install --no-cache-dir instagrapi pillow requests

# Copy project files
COPY package*.json ./
RUN if [ -f package.json ]; then npm install --production 2>/dev/null || true; fi

COPY . .

# Set environment
ENV PORT=4317
ENV NODE_ENV=production
ENV ENABLE_PUBLISHING=true
ENV SOCIALDESK_DATA_DIR=/app/data

EXPOSE 4317

CMD ["node", "server.mjs"]
