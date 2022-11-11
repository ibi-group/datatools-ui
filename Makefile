clean:
	rm -rf dist

docker_build:
	docker compose build frontend

run: docker_build
	docker compose up frontend

build: clean docker_build
	docker compose run frontend npm run build

build-prod: clean docker_build
	docker compose run frontend npm run build-prod

deploy: build-prod
	aws s3 sync ./dist s3://wri-conveyal-gtfs-ui/dist --delete

upload-assets:
	aws s3 sync ./assets s3://wri-conveyal-gtfs-ui/assets --delete
