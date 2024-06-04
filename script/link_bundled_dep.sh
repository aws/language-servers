#!/bin/bash

# This script is needed as a workaround for https://github.com/npm/cli/issues/3466

root_dir=$(dirname "$0")/..
target_package_dir=$(pwd)

if [ -z target_package_dir/package.json ]; then
    echo "package.json not found in the $target_package_dir directory."
    exit 1
fi

# Get the bundleDependencies array from package.json
bundle_dependencies=$(jq -r '.bundleDependencies[]' package.json)

if [ -z "$bundle_dependencies" ]; then
    echo "No bundleDependencies found in package.json."
    exit 0
fi


# Loop through each bundleDependency
for dependency in $bundle_dependencies; do
    dependency_path="$root_dir/node_modules/$dependency"
    
     # Check if the dependency exists in the root node_modules directory
    if [ -d "$dependency_path" ]; then
        # Create a symlink for the dependency
        link_location="node_modules/$dependency"
        link_target=$(readlink -f "$dependency_path")

        mkdir -p $link_location
        # Clear contents or remove last folder in the path
        rm -r $link_location

        ln -s $link_target $link_location
        echo "Symlink created for $dependency"
    else
        echo "ERROR: $dependency not found in the root node_modules directory."
        exit 1
    fi
done