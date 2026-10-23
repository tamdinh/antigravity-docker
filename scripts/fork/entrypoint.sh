#!/usr/bin/env bash
set -e

/usr/local/bin/fork-init.sh

if [ "$#" -eq 0 ] || [ -z "${1:-}" ]; then
    set -- daemon
fi

exec /usr/local/bin/entrypoint.sh "$@"
