# docker build and push image
REPO_NAME=YOUR-DOCKER-REPO-NAME
VERSION=sync-data-$(git rev-parse --abbrev-ref HEAD)-dev

docker image rm $REPO_NAME:$VERSION
docker build -f Dockerfile.dev -t $REPO_NAME:$VERSION .
docker push $REPO_NAME:$VERSION