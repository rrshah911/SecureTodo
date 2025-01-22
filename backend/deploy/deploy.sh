#!/bin/bash

# Variables
EC2_USER=ec2-user
EC2_HOST=$1
KEY_PATH=$2

if [ -z "$EC2_HOST" ] || [ -z "$KEY_PATH" ]; then
    echo "Usage: ./deploy.sh <ec2-host> <key-path>"
    exit 1
fi

# Create deployment package
echo "Creating deployment package..."
cd ..
tar -czf deploy.tar.gz \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    --exclude='venv' \
    --exclude='.env' \
    .


if [ -f .env ]; then
    export $(grep -v '^#' ./.env | xargs)
else
    echo ".env file not found!"
    exit 1
fi


# Create .env file for EC2
echo "Creating .env file..."
cat > deploy/.env << EOL
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
COGNITO_APP_CLIENT_ID=${COGNITO_APP_CLIENT_ID}
DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME}
CORS_ORIGIN=${CORS_ORIGIN}
EOL

# Copy files to EC2
echo "Copying files to EC2..."
scp -i $KEY_PATH deploy.tar.gz $EC2_USER@$EC2_HOST:/home/ec2-user/app/
scp -i $KEY_PATH Dockerfile $EC2_USER@$EC2_HOST:/home/ec2-user/app/
scp -i $KEY_PATH deploy/docker-compose.yml $EC2_USER@$EC2_HOST:/home/ec2-user/app/
scp -i $KEY_PATH deploy/.env $EC2_USER@$EC2_HOST:/home/ec2-user/app/

# Deploy on EC2
echo "Deploying on EC2..."
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
cd /home/ec2-user/app
tar -xzf deploy.tar.gz
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d
rm deploy.tar.gz
EOF

# Clean up local files
rm deploy.tar.gz deploy/.env

echo "Deployment complete!" 