# Stage 1: Build the React Application
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
# Fallback to bun/npm install depending on what's available
RUN npm install

# Copy project files and build
COPY . .
RUN npm run build

# Stage 2: Serve the frontend using Nginx
FROM nginx:alpine AS production

# Copy frontend build
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Create nginx config for React Router fallback and /api proxying to the backend service.
RUN echo 'server { \
    listen 80; \
    location /api/ { \
        proxy_pass http://ease-park-api-service:8000/; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
