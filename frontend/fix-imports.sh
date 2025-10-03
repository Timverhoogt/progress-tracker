#!/bin/bash

# Script to remove import statements and convert exports to global variables
# This is needed to convert ES6 modules to regular scripts

echo "Fixing import statements in JS files..."

find js -name "*.js" -exec sed -i 's/^import.*from.*;//g' {} \;
find js -name "*.js" -exec sed -i 's/^import.*;//g' {} \;

echo "Converting export statements to global variables..."

# Convert export statements to global variables
find js -name "*.js" -exec sed -i 's/^export const \([A-Z_]*\)/window.\1/g' {} \;
find js -name "*.js" -exec sed -i 's/^export function \([a-zA-Z_]*\)/window.\1/g' {} \;
find js -name "*.js" -exec sed -i 's/^export default/window.defaultExport/g' {} \;
find js -name "*.js" -exec sed -i 's/^export \({[^}]*}\)/\/\/ export { /g' {} \;

echo "All import/export statements converted. Files are now compatible with regular script loading."
