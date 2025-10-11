```markdown
# Setup Guide

## Environment

Create `.env` file:
```env
DATABASE_URL="mysql://user:password@localhost:3306/publishing_platform"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000

MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL=false
MINIO_BUCKET_MEDIA="articles-media"
MINIO_BUCKET_COVERS="covers"

STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Use one of the SMTP configurations below and comment out the other
# For Gmail SMTP configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yoursite.com"

# For Zoho Mail SMTP configuration
SMTP_HOST="smtp.zoho.com"
SMTP_PORT=587
SMTP_USER="your-email@zoho.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@yoursite.com"

FRONTEND_URL="http://localhost:3001"
NODE_ENV="development"
```

## Install Dependencies

```bash
npm install
```

## MinIO

Start MinIO container:
```bash
docker run -p 9000:9000 -p 9090:9090 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9090"
```

Create buckets:
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

## MySQL

Install and configure:
```bash
sudo apt install mysql-server -y
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

Create database and user:
```bash
sudo mysql
```

```sql
CREATE DATABASE publishing_platform;
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON publishing_platform.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Database Setup

```bash
npx prisma generate
npx prisma db push
```

## Run Development Server

```bash
npm run dev
```
```