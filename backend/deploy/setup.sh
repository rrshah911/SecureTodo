#!/bin/bash

# Update system packages
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /home/ec2-user/app

# Create docker-compose.yml
cat > /home/ec2-user/app/docker-compose.yml << 'EOL'
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
      - COGNITO_APP_CLIENT_ID=${COGNITO_APP_CLIENT_ID}
      - DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: always
EOL

# Set permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/app 