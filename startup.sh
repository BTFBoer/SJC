#!/bin/sh
set -eu
cd /workspace
npm run dev >>/tmp/sjc-startup.log 2>&1 &
