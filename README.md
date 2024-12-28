# SecureToDo

A secure task management application built with React, Flask, AWS Cognito, and DynamoDB.

## Features

- User authentication with AWS Cognito
- Task creation, editing, and deletion
- Task filtering and sorting
- Real-time updates
- Secure API endpoints
- Responsive design

## Tech Stack

- Frontend:
  - React with TypeScript
  - Material-UI
  - React Query
  - Amazon Cognito Identity SDK
  - Vite

- Backend:
  - Flask
  - PynamoDB
  - AWS Cognito
  - AWS DynamoDB

## Setup

### Prerequisites

- Node.js v18+
- Python 3.10+
- AWS Account with Cognito and DynamoDB set up

### Backend Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Copy the example environment file and update it with your values:
```bash
cp .env.example .env
```

4. Start the Flask server:
```bash
python -m flask run
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Copy the example environment file and update it with your values:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Environment Variables

### Backend (.env)

- `FLASK_APP`: Flask application entry point
- `FLASK_ENV`: Flask environment (development/production)
- `AWS_REGION`: AWS region for services
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `COGNITO_APP_CLIENT_ID`: AWS Cognito App Client ID
- `DYNAMODB_TABLE_NAME`: DynamoDB table name
- `CORS_ORIGIN`: Frontend URL for CORS

### Frontend (.env)

- `VITE_API_URL`: Backend API URL
- `VITE_COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `VITE_COGNITO_APP_CLIENT_ID`: AWS Cognito App Client ID

## Development

- The frontend runs on `http://localhost:5173`
- The backend runs on `http://localhost:5000`
- API endpoints are prefixed with `/api`

## Security

- Environment variables containing sensitive information are not committed to the repository
- AWS Cognito handles user authentication
- API endpoints are protected with Cognito tokens
- CORS is configured for security 