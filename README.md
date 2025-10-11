## Install minIO using as Docker container
```bash
docker run -p 9000:9000 -p 9090:9090 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9090"
```

## Create minio buckets
```bash
sudo docker run --rm -it --network host --entrypoint /bin/bash minio/mc -c "
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin && \
mc mb --ignore-existing local/articles-media && \
mc mb --ignore-existing local/covers && \
mc anonymous set public local/articles-media && \
mc anonymous set public local/covers && \
mc ls local
"
```