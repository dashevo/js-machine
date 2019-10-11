#!/usr/bin/env bash

# Show script in output, and error if anything fails
set -xe

# Ensure the tag matches the one in package.json, otherwise abort.
VERSION="$(jq -r .version package.json)"
PACKAGE_TAG=v"$VERSION"

if [[ "$PACKAGE_TAG" != "$TRAVIS_TAG" ]]; then
  echo "Travis tag (\"$TRAVIS_TAG\") is not equal to package.json tag (\"$PACKAGE_TAG\"). Please push a correct tag and try again."
  exit 1
fi

IMAGE_NAME="dashpay/drive"

# Use regex pattern matching to check if "dev" exists in tag
DOCKER_TAG="latest"
if [[ $PACKAGE_TAG =~ dev ]]; then
  DOCKER_TAG="dev"
fi

docker build --build-arg NODE_ENV=development \
             -t "${IMAGE_NAME}:${DOCKER_TAG}" \
             -t "${IMAGE_NAME}:${VERSION}" \
             .

# Login to Docker Hub
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Push images to the registry
docker push "${IMAGE_NAME}:${DOCKER_TAG}"
docker push "${IMAGE_NAME}:${VERSION}"
