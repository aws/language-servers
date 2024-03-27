#!/bin/sh

set -euo pipefail

EXCLUDED_PACKAGES=("@amzn/eevee-service" "@aws/lsp-codewhisperer" "@aws/lsp-core" "@aws/lsp-json-common" "@aws/lsp-yaml-common" "@c9/eevee-scanner" "@amzn/dexp-runtime-server-build-configuration")
EXCLUDED_LICENSES="MIT,Apache-2.0,BSD-2-Clause,BSD-3-Clause,ISC,0BSD"

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


LICENSE_CHECK_RESULT=$(license-checker --production --exclude $EXCLUDED_LICENSES)
process_packages "$LICENSE_CHECK_RESULT"

# Generate attribution file
(generate-attribution --outputDir './attribution')>/dev/null

ATTRIBUTION_HEADER="The Amazon aws-lsp-codewhisperer includes the following third-party software/licensing:\n\n"
(echo -e $ATTRIBUTION_HEADER && cat './attribution/attribution.txt') > './attribution/THIRD_PARTY_LICENSES'

mkdir -p build/attribution
cp './attribution/THIRD_PARTY_LICENSES' build/attribution

rm ./attribution/attribution.txt
rm ./attribution/licenseInfos.json

