#!/bin/sh

set -ue

CODE_COMMIT_URL="https://git-codecommit.${AWS_REGION}.amazonaws.com/v1/repos/${REPOSITORY_NAME}"

git config --global credential.'https://git-codecommit.*.amazonaws.com'.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
git remote add sync ${CODE_COMMIT_URL}
git push sync --mirror