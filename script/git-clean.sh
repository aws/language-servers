#!/bin/bash

files_to_delete=$(git clean -fdxn)
if [ -z "$files_to_delete" ]; then
    echo "No files to delete with 'git clean -fdx'"
else
    echo "Files that would be deleted with 'git clean -fdx':"
    echo "$files_to_delete"
    read -p "Are you sure you want to delete these files? (y/n): " answer

    if [ $answer = "y" ]; then
        echo "Deleting files..."
        git clean -fdx
        echo "Files deleted successfully."
    else
        echo "'git clean -fdx' operation cancelled."
    fi
fi