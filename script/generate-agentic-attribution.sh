#!/bin/bash

# This script performs license checks and compiles a license attribution file 
# for the agentic chat bundle.
# It requires prepare-attribution-dependencies.ts to run first, in order to 
# handle multiple packages from this monorepo.
# 
# To use, call npm run ci:generate:agentic:attribution

set -euo pipefail

#----------------------------------------
# Perform license checks
#----------------------------------------

EXCLUDED_PACKAGES=("@amzn/monorepo-language-servers" "@aws/lsp-codewhisperer" "@aws/lsp-core" "@amzn/dexp-runtime-server-build-configuration" "caniuse-lite" "pako")
EXCLUDED_LICENSES="MIT,Apache-2.0,BSD-2-Clause,BSD-3-Clause,ISC,0BSD,Python-2.0,BlueOak-1.0.0"

process_packages() {
  local output="$1"
  IFS=$'\n'

  for line in $output; do
    # Extract package_name from "package_name@1.0.0"
    if [[ "$line" =~ ^├─\ (.+)@ ]]; then
      package_name="${BASH_REMATCH[1]}"

      if [[ ! "${EXCLUDED_PACKAGES[*]}" =~ "${package_name}" ]]; then
        echo "License for package '$package_name'  is either not pre-approved or package is not in the excluded package list."
        exit 1
      fi
    fi
  done

  IFS=$' \t\n'
}

LICENSE_CHECK_RESULT=$(npx license-checker --production --exclude $EXCLUDED_LICENSES)
process_packages "$LICENSE_CHECK_RESULT"

#----------------------------------------
# Generate attribution file
#----------------------------------------

# The attribution folder is where overrides.json is, which influences generate-attribution behavior.
ATTRIBUTION_FOLDER="attribution"
mkdir -p $ATTRIBUTION_FOLDER

(npx generate-attribution --outputDir $ATTRIBUTION_FOLDER)>/dev/null

ATTRIBUTION_HEADER="The Amazon aws-lsp-codewhisperer bundle includes the following third-party software/licensing:\n\n"
(echo -e $ATTRIBUTION_HEADER && cat "$ATTRIBUTION_FOLDER/attribution.txt") > "$ATTRIBUTION_FOLDER/THIRD_PARTY_LICENSES"

echo "Third party attribution: $ATTRIBUTION_FOLDER/THIRD_PARTY_LICENSES"

rm $ATTRIBUTION_FOLDER/attribution.txt
rm $ATTRIBUTION_FOLDER/licenseInfos.json

echo "Attribution generation completed."
