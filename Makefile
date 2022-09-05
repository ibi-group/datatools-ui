clean:
	rm -rf dist

docker_build:
	docker build -t wri-conveyal-gtfs-ui-mastarm:4.1.0 .

run: docker_build
	docker run -p 9966:9966 -p 4000:4000 --volume ${PWD}:/app wri-conveyal-gtfs-ui-mastarm:4.1.0

build: docker_build clean
	docker run --rm --volume ${PWD}/dist:/app/dist wri-conveyal-gtfs-ui-mastarm:4.1.0 npm run build

build-prod: docker_build clean
	docker run --rm --volume ${PWD}/dist:/app/dist wri-conveyal-gtfs-ui-mastarm:4.1.0 npm run build-prod

deploy: build-prod
	aws s3 sync ./dist s3://wri-conveyal-gtfs-ui/dist --delete

upload-assets:
	aws s3 sync ./assets s3://wri-conveyal-gtfs-ui/assets --delete
