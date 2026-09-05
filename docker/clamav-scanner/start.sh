#!/bin/bash
set -e

echo "Updating virus definitions..."
freshclam --quiet || echo "freshclam failed, continuing with bundled definitions"

echo "Starting clamd..."
clamd &

echo "Waiting for clamd to accept connections on port 3310..."
until nc -z 127.0.0.1 3310; do
  sleep 2
done
echo "clamd is ready."

echo "Starting REST wrapper..."
exec node server.js
