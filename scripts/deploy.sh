#!/usr/bin/env bash
set -e
cd "${0%/*}"

echo "> build"
pnpm build
pnpm test

echo "> deploy infrastructure"
terraform -chdir=../terraform init
terraform -chdir=../terraform apply

export CLOUDFRONT_DISTRIBUTION_ID=$(terraform -chdir=../terraform output -raw cloudfront_distribution_id)
export AWS_SHARED_CREDENTIALS_FILE=$(realpath ../aws.ini)

echo "> sync primary to secondary origin"
aws s3 sync \
  "s3://neverhaven.incomplete.quest/primary" \
  "s3://neverhaven.incomplete.quest/secondary"

echo "> sync new assets to primary origin"
aws s3 sync \
  ../packages/web-app/dist \
  "s3://neverhaven.incomplete.quest/primary" \
  --delete

echo "> invalidate cloudfront cache"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"
