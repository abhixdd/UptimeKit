# UptimeKit

A robust uptime monitoring solution designed for tracking the availability and performance of web services and APIs. UptimeKit provides real-time monitoring, detailed performance analytics, and immediate status alerts through a streamlined dashboard.

## Preview

![UptimeKit Dashboard](./screenshots/preview.png)

## Key Features

- **Real-time Monitoring**: Automated health checks performed at one-minute intervals.
- **Protocol Support**: Comprehensive monitoring for **HTTP/HTTPS**, **DNS**, and **ICMP Ping**.
- **Dynamic Organization**: Drag-and-drop interface for customized monitor prioritization.
- **Performance Analytics**: Individual historical charts for each monitor tracking response times (average, minimum, and maximum).
- **Theming System**: High-quality design with multiple themes including Midnight, Forest, Cosmic, and Claude.
- **Responsive Interface**: Optimized for both desktop and mobile environments.
- **Management Tools**: Comprehensive CRUD operations for monitors, including the ability to pause tracking without data loss.
- **Live Updates**: Automatic dashboard synchronization every 30 seconds.

## Status Indicators

UptimeKit uses a standardized color-coding system to represent service health:

- 🟢 **Operational**: Response time is below 1000ms.
- 🟡 **Degraded**: Response time is between 1000ms and 5000ms.
- 🔴 **Down**: Service is unreachable or response time exceeds 5000ms.

## Installation and Setup

### Docker Deployment (Recommended)

The most efficient method to deploy UptimeKit is using Docker and Docker Compose.

**Prerequisites:**
- Docker and Docker Compose

**Quick Start:**

```bash
# Clone the repository
git clone https://github.com/abhixdd/UptimeKit.git
cd UptimeKit

# Build and initiate the stack
docker-compose up --build
```

**Access Points:**
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

**Operational Commands:**

```bash
# Stop the infrastructure
docker-compose down

# Reset environment (removes volumes)
docker-compose down -v
```

**Architecture Overview:**
- **Backend**: Node.js Alpine environment running an Express server.
- **Frontend**: Multi-stage build (Vite/Nginx) for optimized asset delivery.
- **Database**: SQLite database persisted via Docker volumes.
- **Networking**: Isolated communication through a dedicated Docker bridge network.

---

### Manual Installation

For environments where Docker is not available, UptimeKit can be installed directly via Node.js.

**Prerequisites:**
- Node.js (v14+)
- npm or yarn

**Installation:**

```bash
# Clone the repository
git clone https://github.com/abhixdd/UptimeKit.git
cd UptimeKit

# Install all dependencies
npm run install:all
```

**Development Environment:**

```bash
npm run dev
```

This command initializes both the backend and frontend development servers concurrently. Access the dashboard at `http://localhost:5173`.

**Configuration:** Documentation for environment variables can be found in `backend/.env.example`.

---

## API Reference

The backend exposes the following RESTful endpoints:

- `GET /api/monitors` - Retrieve all configured monitors
- `POST /api/monitors` - Create a new monitor
- `PUT /api/monitors/:id` - Update existing monitor configuration
- `DELETE /api/monitors/:id` - Remove a monitor
- `PATCH /api/monitors/:id/pause` - Toggle monitoring status
- `GET /api/monitors/:id/chart/uptime` - Fetch uptime historical data
- `GET /api/monitors/:id/chart/response-time` - Fetch response time metrics
- `GET /api/monitors/:id/history` - Retrieve recent check logs
- `GET /api/monitors/:id/downtime` - Detailed information on the most recent outage

## User Guide

1. **Adding Monitors**: Utilize the "Add Monitor" interface to register a new service.
2. **Configuration**: 
   - **HTTP/HTTPS**: Monitor web application availability.
   - **DNS**: Validate domain name resolution.
   - **ICMP Ping**: Verify network-level connectivity.
3. **Observation**: Status updates are pushed to the dashboard automatically. Use the monitor-specific menus to access detailed charts or modify configurations.

## Contributing

Contributions to UptimeKit are encouraged. Please review the codebase and submit pull requests for any improvements or bug fixes.

## Support

For technical issues or feature requests, please utilize the [GitHub Issues](https://github.com/abhixdd/UptimeKit/issues) tracker.

## License

This project is licensed under the MIT License.

---

**UptimeKit** - Professional Monitoring Solutions.
