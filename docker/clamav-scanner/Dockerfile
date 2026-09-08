FROM node:20-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends clamav clamav-daemon clamav-freshclam netcat-traditional ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    freshclam --quiet || true

# Expose clamd over a local TCP port instead of the default unix socket, so
# our Node wrapper (running in the same container) can talk to it.
RUN sed -i 's/^#\?TCPSocket .*/TCPSocket 3310/' /etc/clamav/clamd.conf && \
    sed -i 's/^#\?TCPAddr .*/TCPAddr 127.0.0.1/' /etc/clamav/clamd.conf && \
    sed -i 's/^LocalSocket /#LocalSocket /' /etc/clamav/clamd.conf

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev

COPY server.js start.sh ./
RUN chmod +x start.sh

EXPOSE 8080
CMD ["./start.sh"]
