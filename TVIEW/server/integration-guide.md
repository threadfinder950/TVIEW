# Time Tunnel - Frontend and Backend Integration Guide

This guide will help you set up the complete Time Tunnel application with both the frontend and backend components working together.

## Project Structure

Create a structure like this for your project:

```
time-tunnel/
├── client/             # Frontend React application
├── server/             # Backend Node.js API
└── README.md           # Main project documentation
```

## Backend Setup

1. Navigate to the server directory:

```bash
cd time-tunnel/server
```

2. Initialize a new Node.js project:

```bash
npm init -y
```

3. Copy all the TypeScript files and configurations from the backend repository.

4. Install dependencies:

```bash
npm install
```

5. Create the required directories:

```bash
mkdir -p uploads exports logs
```

6. Create a `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetunnel
NODE_ENV=development
LOG_LEVEL=info
UPLOAD_PATH=./uploads
EXPORT_PATH=./exports
```

7. Start MongoDB:

```bash
# If using MongoDB locally
mongod --dbpath /path/to/data/directory

# If using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

8. Start the development server:

```bash
npm run dev
```

## Frontend Setup

1. Navigate to the client directory:

```bash
cd time-tunnel/client
```

2. Create a new Vite React application:

```bash
npm create vite@latest . -- --template react-ts
```

3. Copy all the React component files and configurations from the frontend repository.

4. Install dependencies:

```bash
npm install
```

5. Create a `.env` file to connect to the backend:

```
VITE_API_URL=http://localhost:5000/api
```

6. Start the development server:

```bash
npm run dev
```

## Environment Configuration

### Production Configuration

For a production environment, update the following:

1. Backend `.env`:

```
PORT=5000
MONGODB_URI=mongodb://[production-mongodb-url]/timetunnel
NODE_ENV=production
LOG_LEVEL=warn
UPLOAD_PATH=./uploads
EXPORT_PATH=./exports
```

2. Frontend `.env.production`:

```
VITE_API_URL=https://your-production-api-url/api
```

## Docker Setup (Optional)

To containerize both applications:

1. Create a `docker-compose.yml` file in the project root:

```yaml
version: '3'

services:
  # MongoDB
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - time-tunnel-network

  # Backend API
  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/timetunnel
      - NODE_ENV=production
      - LOG_LEVEL=info
      - UPLOAD_PATH=./uploads
      - EXPORT_PATH=./exports
    volumes:
      - server-uploads:/app/uploads
      - server-exports:/app/exports
    depends_on:
      - mongodb
    networks:
      - time-tunnel-network

  # Frontend React app
  client:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://server:5000/api
    depends_on:
      - server
    networks:
      - time-tunnel-network

networks:
  time-tunnel-network:
    driver: bridge

volumes:
  mongo-data:
  server-uploads:
  server-exports:
```

2. Create a `Dockerfile` in the server directory:

```Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create required directories
RUN mkdir -p uploads exports logs

EXPOSE 5000

CMD ["npm", "start"]
```

3. Create a `Dockerfile` in the client directory:

```Dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

4. Create an `nginx.conf` in the client directory:

```
server {
    listen 80;
    server_name _;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

5. Start the entire application:

```bash
docker-compose up -d
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues during development:

1. Ensure the backend has proper CORS configuration:

```typescript
// In app.ts
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  credentials: true
}));
```

2. Check that your frontend is making requests to the correct URL:

```typescript
// Example API call in frontend
const response = await axios.get(`${import.meta.env.VITE_API_URL}/persons`);
```

### Database Connection Issues

1. Check MongoDB connection:

```bash
mongo mongodb://localhost:27017/timetunnel
```

2. Verify the MongoDB URI in your `.env` file.

### File Upload Issues

1. Ensure upload directory exists and has proper permissions:

```bash
mkdir -p uploads
chmod 755 uploads
```

2. Check file size limits in the Multer configuration.
