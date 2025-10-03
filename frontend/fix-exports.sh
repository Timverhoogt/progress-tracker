#!/bin/bash

# Script to convert all export statements to global variables or remove them
echo "Converting all export statements..."

# Remove all export keywords from class declarations
find js -name "*.js" -exec sed -i 's/^export class/class/g' {} \;

# Remove all export keywords from function declarations
find js -name "*.js" -exec sed -i 's/^export function/function/g' {} \;

# Remove all export keywords from async function declarations
find js -name "*.js" -exec sed -i 's/^export async function/async function/g' {} \;

# Remove all remaining export statements
find js -name "*.js" -exec sed -i '/^export /d' {} \;

echo "All export statements converted or removed."

