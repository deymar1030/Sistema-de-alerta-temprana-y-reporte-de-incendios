#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/ALERTA_Movil"
npm install --no-audit --no-fund
npm run dev
