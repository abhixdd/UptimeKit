# UptimeKit 🚀

A simple uptime monitoring dashboard to keep track of your websites and APIs. Get real-time updates, beautiful charts, and know exactly when something goes down.

## Preview 

![UptimeKit Dashboard](./screenshots/preview.png)

## Features ✨

- Real-time monitoring - checks every minute
- Individual charts for each monitor
- Track response times (avg, min, max)
- Beautiful dark/light mode
- Mobile responsive - works everywhere
- Edit or delete monitors anytime
- Pause monitoring without losing data
- See exactly when something goes down
- Auto-refreshes every 30 seconds

## Status Colors

- 🟢 **Operational** - Response time < 1000ms
- 🟡 **Degraded** - Response time 1000-5000ms
- 🔴 **Down** - Service unavailable or response time > 5000ms

## Getting Started 🎯

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abhixdd/UptimeKit.git
cd UptimeKit

# Install all dependencies (root, backend, frontend)
npm run install:all
```

### Running the Application (development)

```bash
npm run dev
```

This runs both the backend (port 3000) and the frontend dev server (port 5173) concurrently for local development.

Open browser: `http://localhost:5173`

**Optional:** Create a `.env` file in the `backend` folder (copy from `.env.example`) to customize the port or other settings.

### Docker (quick start)

You can run the full stack with Docker Compose. This builds containerized versions of the backend and frontend (served by nginx) and starts everything together. Perfect for production deployments!

**Prerequisites:**

- Docker & Docker Compose installed

**Build and start:**

```bash
docker-compose up --build
```

**After startup, access:**

- Frontend: `localhost:5173`
- Backend API: `localhost:3000`

**How it works:**

- **Backend container**: Node.js Alpine image running Express server on port 3000
- **Frontend container**: Multi-stage build with Node/Vite for building, nginx for serving on port 5173
- **Database**: SQLite database persists in a Docker volume (`backend-data`)
- **Networking**: Services communicate via Docker internal network

**To stop:**

```bash
docker-compose down
```

**To remove all data and start fresh:**

```bash
docker-compose down -v
```


## API Endpoints 📡

- `GET /api/monitors` - Get all monitors
- `POST /api/monitors` - Create monitor
- `PUT /api/monitors/:id` - Update monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `PATCH /api/monitors/:id/pause` - Toggle pause
- `GET /api/monitors/:id/chart/uptime` - Uptime chart data
- `GET /api/monitors/:id/chart/response-time` - Response time chart data
- `GET /api/monitors/:id/history` - Last 30 checks

## Usage 📖

1. Click "Add Monitor" to add a new website/API to monitor
2. Enter a name and URL (e.g., https://example.com)
3. Monitor status updates automatically every minute
4. View charts, pause, edit, or delete monitors from the menu

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Support 💬

If you encounter any issues, please open an issue on GitHub: [GitHub Issues](https://github.com/abhixdd/UptimeKit/issues)

## Author 👨‍💻

**Abhi** - [GitHub Profile](https://github.com/abhixdd)

---

**Made with ❤️ for monitoring enthusiasts**

Star ⭐ the repository if you find it helpful!
