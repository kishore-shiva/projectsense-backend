# Use a node base image
FROM node:18.16.1

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the backend folder to the working directory
COPY /package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend application code from the projectsense-main folder to the working directory
COPY / .

# Expose the ports your backend servers listen to
EXPOSE 5000
EXPOSE 5500

# Command to run both backend servers
CMD ["npm", "start"]
