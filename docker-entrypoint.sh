#!/bin/sh
set -e

DATA_PATH="${DATA_DIR:-/app/data}"

# If running as root, ensure /app/data is owned by node and drop privileges
if [ "$(id -u)" = '0' ]; then
    mkdir -p "$DATA_PATH"
    chown -R node:node "$DATA_PATH"
    
    # Initialize seed db.json if not present
    if [ ! -f "$DATA_PATH/db.json" ] && [ -f /app/data-default/db.json ]; then
        cp /app/data-default/db.json "$DATA_PATH/db.json"
        chown node:node "$DATA_PATH/db.json"
    fi

    exec su-exec node "$@"
else
    exec "$@"
fi
