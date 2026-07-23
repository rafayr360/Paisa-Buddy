# Use a simple Nginx image to serve the built files
FROM nginx:stable-alpine

# Copy the local 'dist' folder (which you build locally) into the container
COPY dist /usr/share/nginx/html

# Copy the custom Nginx configuration to enable SPA routing (fixes 404 on refresh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
