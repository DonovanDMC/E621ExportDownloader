#!/bin/sh
npx rimraf dist

npx tsc -p tsconfig.json
npx copyfiles -u 1 "lib/**/*.d.ts" dist/lib
