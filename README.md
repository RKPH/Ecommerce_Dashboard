# React Dashboard Application

Welcome to the React Dashboard Application! This is a Dockerized React application built with Vite, designed to serve as the frontend for a dashboard interface. It communicates with a backend API via Axios instances configured in the `api` directory. This README provides instructions for setting up, configuring, and running the application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Configure the API URL](#configure-the-api-url)
  - [Build and Run with Docker](#build-and-run-with-docker)
  - [Running Locally (Without Docker)](#running-locally-without-docker)
- [Project Structure](#project-structure)
- [Networking](#networking)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) for containerization
- [Node.js](https://nodejs.org/) (version 18 LTS) for local development
- [npm](https://www.npmjs.com/) (included with Node.js)

## Getting Started

### Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/RKPH/Ecommerce_Dashboard.git
cd Ecommerce_Dashboard
```

### Configure the API URL

The application uses Axios to communicate with the backend API. The base URL for API requests is configured in the `src/api/axiosInstance.js` file. Follow these steps to set it up:

1. **Locate the Axios configuration**:
   Open the file `src/api/axiosInstance.js`.

2. **Update the `BASE_URL`**:
   Modify the `BASE_URL` constant to point to your backend API. The default is set to `https://backend.d2f.io.vn/api/v1`. For example:

   ```javascript
   const BASE_URL = "https://your-backend-api-url/api/v1";
   ```

   Replace `https://your-backend-api-url/api/v1` with the actual URL of your backend API (e.g., `http://localhost:3000/api/v1` for local development).

3. **Secure the configuration**:
   Ensure the backend API URL is correct and accessible. Avoid hardcoding sensitive information (e.g., API keys) in this file.

**Note**: The `.env` file is optional for additional environment variables like `REACT_APP_API_URL` or `VITE_BASE_URL`. If used, create a `.env` file in the project root with the following template:

**`.env` Template** (optional):

```env
# Backend API URL (optional, fallback to axiosInstance.js)
REACT_APP_API_URL=https://your-backend-api-url/api/v1
VITE_BASE_URL=https://your-backend-api-url/api/v1
```

Add `.env` to `.gitignore` to prevent committing sensitive information.

### Build and Run with Docker

The application is containerized using Docker and managed with Docker Compose. Follow these steps:

1. **Ensure the shared network exists**:
   The application uses an external Docker network named `shared-network`. Create it if it doesn't exist:

   ```bash
   docker network create shared-network
   ```

2. **Build and run the application**:
   Use Docker Compose to build and start the container:

   ```bash
   docker-compose up --build
   ```

   This command:
   - Builds the Docker image using the `Dockerfile`.
   - Starts the container, mapping port `5174` on the host to port `5174` in the container.
   - Loads environment variables from the `.env` file (if present).
   - Mounts the project directory for live updates.

3. **Access the application**:
   Once running, the application will be available at `http://localhost:5174`.

4. **Stop the application**:
   To stop the container, press `Ctrl+C` or run:

   ```bash
   docker-compose down
   ```

### Running Locally (Without Docker)

To run the application locally without Docker:

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Ensure the API URL is configured** in `src/api/axiosInstance.js` as described above.

3. **Start the Vite development server**:

   ```bash
   npm run dev
   ```

4. **Access the application** at `http://localhost:5174`.

## Project Structure

- `Dockerfile`: Defines the Docker image for the React application.
- `docker-compose.yml`: Configures the Docker Compose service for the dashboard.
- `src/api/axiosInstance.js`: Configures Axios instances for API requests.
- `package.json`: Project dependencies and scripts.
- `src/`: React application source code.

## Networking

The application uses an external Docker network (`shared-network`) to communicate with other services (e.g., the backend API). Ensure the network is created and that the backend service is also connected to `shared-network`.

To verify the network:

```bash
docker network ls
```

To connect other services to the network, include `shared-network` in their Docker Compose configuration.

## Troubleshooting

- **Port conflicts**: If port `5174` is in use, modify the `ports` mapping in `docker-compose.yml` (e.g., `"8080:5174"`).
- **API connectivity**: Ensure the `BASE_URL` in `src/api/axiosInstance.js` is correct and the backend API is running.
- **Network issues**: Verify that the `shared-network` exists and the backend service is accessible.
- **Docker issues**: Check container logs with `docker logs dashboard-app` or `docker-compose logs`.

## Contributing

1. Fork the repository.
2. Create a branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Happy coding! For issues or questions, open an issue in the [repository](https://github.com/RKPH/EcommerceFrontend).
