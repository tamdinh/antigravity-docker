#!/usr/bin/env bash
set -e

/usr/local/bin/fork-init.sh
exec /usr/local/bin/entrypoint.sh "$@"
