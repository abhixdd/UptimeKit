const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const dns = require('dns').promises;
const ping = require('ping');
const { getAllMonitors, addMonitor, deleteMonitor, updateMonitorStatus, getUptimePercentage, getUptimeChartData, getResponseTimeChartData, getMonitorHistory, updateMonitor, toggleMonitorPause, getMonitorUptimeChartData, getMonitorResponseTimeChartData } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/api/monitors', (req, res) => {
  getAllMonitors((err, rows) => {
    if (err) {
      console.error('Error fetching monitors:', err.message);
      return res.status(500).json({ error: 'Failed to fetch monitors' });
    }
    const monitorsWithType = rows.map(monitor => ({
      ...monitor,
      type: monitor.type || 'http'
    }));
    res.json(monitorsWithType);
  });
});

app.post('/api/monitors', (req, res) => {
  const { name, url, type = 'http' } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  addMonitor(name, url, type, (err, id) => {
    if (err) {
      console.error('Error adding monitor:', err.message);
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A monitor with this URL and type already exists' });
      }
      return res.status(500).json({ error: 'Failed to add monitor' });
    }
    res.status(201).json({ 
      id, 
      name, 
      url, 
      type: type || 'http', 
      status: 'unknown',
      response_time: 0,
      paused: 0,
      message: 'Monitor added successfully' 
    });
  });
});

app.delete('/api/monitors/:id', (req, res) => {
  const { id } = req.params;
  deleteMonitor(id, (err) => {
    if (err) {
      console.error('Error deleting monitor:', err.message);
      return res.status(500).json({ error: 'Failed to delete monitor' });
    }
    res.json({ message: 'Monitor deleted successfully' });
  });
});

app.get('/api/monitors/:id/uptime', (req, res) => {
  const { id } = req.params;
  getUptimePercentage(id, (err, percentage) => {
    if (err) {
      console.error('Error fetching uptime:', err.message);
      return res.status(500).json({ error: 'Failed to fetch uptime' });
    }
    res.json({ uptime: percentage });
  });
});

app.get('/api/charts/uptime', (req, res) => {
  getUptimeChartData((err, data) => {
    if (err) {
      console.error('Error fetching uptime chart data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch uptime data' });
    }
    res.json(data || []);
  });
});

app.get('/api/charts/response-time', (req, res) => {
  getResponseTimeChartData((err, data) => {
    if (err) {
      console.error('Error fetching response time data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch response time data' });
    }
    res.json(data || []);
  });
});

app.put('/api/monitors/:id', (req, res) => {
  const { id } = req.params;
  const { name, url, type = 'http' } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  updateMonitor(id, name, url, type, (err) => {
    if (err) {
      console.error('Error updating monitor:', err.message);
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A monitor with this URL and type already exists' });
      }
      return res.status(500).json({ error: 'Failed to update monitor' });
    }
    res.json({ message: 'Monitor updated successfully' });
  });
});

app.patch('/api/monitors/:id/pause', (req, res) => {
  const { id } = req.params;
  const { paused } = req.body;
  toggleMonitorPause(id, paused, (err) => {
    if (err) {
      console.error('Error updating pause status:', err.message);
      return res.status(500).json({ error: 'Failed to update pause status' });
    }
    res.json({ paused, message: paused ? 'Monitoring paused' : 'Monitoring resumed' });
  });
});

app.get('/api/monitors/:id/history', (req, res) => {
  const { id } = req.params;
  getMonitorHistory(id, (err, data) => {
    if (err) {
      console.error('Error fetching monitor history:', err.message);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(data || []);
  });
});

app.get('/api/monitors/:id/chart/uptime', (req, res) => {
  const { id } = req.params;
  getMonitorUptimeChartData(id, (err, data) => {
    if (err) {
      console.error('Error fetching monitor uptime chart data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch uptime data' });
    }
    res.json(data || []);
  });
});

app.get('/api/monitors/:id/chart/response-time', (req, res) => {
  const { id } = req.params;
  getMonitorResponseTimeChartData(id, (err, data) => {
    if (err) {
      console.error('Error fetching monitor response time data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch response time data' });
    }
    res.json(data || []);
  });
});

// Check DNS resolution
async function checkDns(monitor) {
  const start = Date.now();
  try {
    // Extract hostname from URL
    let hostname = monitor.url;
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      hostname = new URL(monitor.url).hostname;
    }

    await dns.resolve4(hostname);
    const responseTime = Date.now() - start;

    let status = 'down';
    if (responseTime < 1000) {
      status = 'up';
    } else if (responseTime < 5000) {
      status = 'slow';
    } else {
      status = 'down';
    }

    updateMonitorStatus(monitor.id, status, responseTime, null, (err) => {
      if (err) {
        console.error(`Error updating DNS monitor ${monitor.id}:`, err.message);
      }
    });
  } catch (error) {
    const responseTime = Date.now() - start;
    const errorMessage = error.message || 'DNS resolution failed';
    updateMonitorStatus(monitor.id, 'down', responseTime, errorMessage, (err) => {
      if (err) {
        console.error(`Error updating DNS monitor ${monitor.id}:`, err.message);
      }
    });
  }
}

// Check ICMP ping
async function checkPing(monitor) {
  const start = Date.now();
  try {
    let hostname = monitor.url;
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      hostname = new URL(monitor.url).hostname;
    }

    const result = await ping.promise.probe(hostname, {
      timeout: 2
    });

    const responseTime = Date.now() - start;

    let status = 'down';
    if (result.alive) {
      const pingTime = typeof result.time === 'number' ? result.time : responseTime;
      if (pingTime < 1000) {
        status = 'up';
      } else if (pingTime < 5000) {
        status = 'slow';
      } else {
        status = 'down';
      }
    }

    updateMonitorStatus(monitor.id, status, responseTime, null, (err) => {
      if (err) {
        console.error(`Error updating PING monitor ${monitor.id}:`, err.message);
      }
    });
  } catch (error) {
    const responseTime = Date.now() - start;
    const errorMessage = error.message || 'Ping failed';
    updateMonitorStatus(monitor.id, 'down', responseTime, errorMessage, (err) => {
      if (err) {
        console.error(`Error updating PING monitor ${monitor.id}:`, err.message);
      }
    });
  }
}

// Check monitor status
async function checkUptime(monitor) {
  const start = Date.now();
  try {
    const response = await axios.get(monitor.url, { timeout: 10000 });
    const responseTime = Date.now() - start;

    let status = 'down';
    if (response.status === 200) {
      if (responseTime < 1000) {
        status = 'up';
      } else if (responseTime < 5000) {
        status = 'slow';
      } else {
        status = 'down';
      }
    }

    updateMonitorStatus(monitor.id, status, responseTime, null, (err) => {
      if (err) {
        console.error(`Error updating monitor ${monitor.id}:`, err.message);
      }
    });
  } catch (error) {
    const responseTime = Date.now() - start;
    const errorMessage = error.response?.statusText || error.message || 'Unknown error';
    updateMonitorStatus(monitor.id, 'down', responseTime, errorMessage, (err) => {
      if (err) {
        console.error(`Error updating monitor ${monitor.id}:`, err.message);
      }
    });
  }
}

// Run checks every minute
cron.schedule('* * * * *', () => {
  console.log('Running uptime checks...');
  getAllMonitors((err, monitors) => {
    if (err) {
      console.error('Error fetching monitors for check:', err.message);
      return;
    }
    monitors.forEach(monitor => {
      if (!monitor.paused) {
        if (monitor.type === 'dns') {
          checkDns(monitor);
        } else if (monitor.type === 'icmp') {
          checkPing(monitor);
        } else {
          checkUptime(monitor);
        }
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`UptimeKit backend server running on port ${PORT}`);
});