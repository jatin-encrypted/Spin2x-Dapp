# Use Node.js to serve the static web app
FROM node:20-alpine

WORKDIR /app

# Copy the built web app and server
COPY dist/ ./dist/
COPY server.js ./

# Expose port 3000
EXPOSE 3000

CMD ["node", "server.js"]
