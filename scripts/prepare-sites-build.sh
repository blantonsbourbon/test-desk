#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node_bin="${NODE_BIN:-/home/kratos/.local/bin/node}"
angular_cli="$project_dir/frontend/node_modules/@angular/cli/bin/ng.js"

"$node_bin" "$angular_cli" build --configuration production --project frontend
rm -rf "$project_dir/dist"
mkdir -p "$project_dir/dist/server"
cp -R "$project_dir/frontend/dist/frontend/browser"/. "$project_dir/dist"/
if test -f "$project_dir/frontend/dist/frontend/3rdpartylicenses.txt"; then
  cp "$project_dir/frontend/dist/frontend/3rdpartylicenses.txt" "$project_dir/dist/"
fi
cp "$project_dir/scripts/sites-worker.js" "$project_dir/dist/server/index.js"

echo "Prepared Sites build at $project_dir/dist"
