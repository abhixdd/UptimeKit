const sqlite3 = require('sqlite3').verbose();
const dbPath = 'uptimekit.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Current working directory:', process.cwd());
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.run('PRAGMA foreign_keys = ON');

// Initialize database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT DEFAULT 'http',
      status TEXT DEFAULT 'unknown',
      response_time INTEGER DEFAULT 0,
      last_checked DATETIME DEFAULT (datetime('now')),
      paused INTEGER DEFAULT 0,
      UNIQUE(url, type)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Monitors table ready.');
    }
  });

  db.run(`
    ALTER TABLE monitors ADD COLUMN paused INTEGER DEFAULT 0
  `, (err) => {
    if (err && err.code !== 'SQLITE_ERROR') {
      console.error('Error adding paused column:', err.message);
    }
  });

  db.run(`
    ALTER TABLE monitors ADD COLUMN type TEXT DEFAULT 'http'
  `, (err) => {
    if (err && err.code !== 'SQLITE_ERROR') {
      console.error('Error adding type column:', err.message);
    }
  });

  db.run(`
    UPDATE monitors SET type = 'http' WHERE type IS NULL
  `, (err) => {
    if (err) {
      console.error('Error updating monitor types:', err.message);
    } else {
      console.log('Monitor types updated.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS monitor_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      response_time INTEGER DEFAULT 0,
      error_message TEXT,
      checked_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating history table:', err.message);
    } else {
      console.log('Monitor history table created or already exists.');
    }
  });
});

// Get all monitors
function getAllMonitors(callback) {
  db.all('SELECT * FROM monitors ORDER BY id', callback);
}

// Add a new monitor
function addMonitor(name, url, type = 'http', callback) {
  const stmt = db.prepare('INSERT INTO monitors (name, url, type) VALUES (?, ?, ?)');
  stmt.run([name, url, type], function(err) {
    callback(err, this.lastID);
  });
  stmt.finalize();
}

// Delete a monitor
function deleteMonitor(id, callback) {
  const stmt = db.prepare('DELETE FROM monitors WHERE id = ?');
  stmt.run([id], callback);
  stmt.finalize();
}

// Update monitor status and response time
function updateMonitorStatus(id, status, responseTime, errorMessage = null, callback) {
  if (typeof errorMessage === 'function') {
    callback = errorMessage;
    errorMessage = null;
  }
  
  const stmt = db.prepare('UPDATE monitors SET status = ?, response_time = ?, last_checked = datetime("now") WHERE id = ?');
  stmt.run([status, responseTime, id], (err) => {
    if (err) {
      callback(err);
      return;
    }
    const historyStmt = db.prepare('INSERT INTO monitor_history (monitor_id, status, response_time, error_message, checked_at) VALUES (?, ?, ?, ?, datetime("now"))');
    historyStmt.run([id, status, responseTime, errorMessage], callback);
    historyStmt.finalize();
  });
  stmt.finalize();
}

// Get uptime percentage for a monitor (last 24 hours)
function getUptimePercentage(id, callback) {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_count
    FROM monitor_history
    WHERE monitor_id = ? 
    AND checked_at > datetime('now', '-24 hours')
  `;
  db.get(query, [id], (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (!row || row.total === 0) {
      callback(null, 100);
      return;
    }
    const percentage = ((row.up_count / row.total) * 100).toFixed(1);
    callback(null, parseFloat(percentage));
  });
}

// Get uptime chart data for all monitors (last 24 hours)
function getUptimeChartData(callback) {
  const query = `
    SELECT 
      strftime('%H:%M', checked_at) as time,
      AVG(CASE WHEN status = 'up' THEN 100 ELSE 0 END) as uptime
    FROM monitor_history
    WHERE checked_at > datetime('now', '-24 hours')
    GROUP BY strftime('%H', checked_at)
    ORDER BY checked_at ASC
  `;
  db.all(query, callback);
}

// Get response time chart data for all monitors (last 24 hours)
function getResponseTimeChartData(callback) {
  const query = `
    SELECT 
      strftime('%H:%M', checked_at) as time,
      AVG(response_time) as avgResponse
    FROM monitor_history
    WHERE checked_at > datetime('now', '-24 hours')
    GROUP BY strftime('%H', checked_at)
    ORDER BY checked_at ASC
  `;
  db.all(query, callback);
}

// Get monitor history (last 30 checks)
function getMonitorHistory(id, callback) {
  const query = `
    SELECT id, status, response_time, checked_at, error_message
    FROM monitor_history
    WHERE monitor_id = ?
    ORDER BY checked_at DESC
    LIMIT 30
  `;
  db.all(query, [id], callback);
}

// Get uptime chart data for a specific monitor (last 24 hours, 10-minute intervals)
function getMonitorUptimeChartData(id, callback) {
  const query = `
    SELECT 
      strftime('%H:%M', checked_at) as time,
      AVG(CASE WHEN status = 'up' THEN 100 ELSE 0 END) as uptime
    FROM monitor_history
    WHERE monitor_id = ? 
    AND checked_at > datetime('now', '-24 hours')
    GROUP BY datetime(checked_at, '-10 minutes')
    ORDER BY checked_at ASC
  `;
  db.all(query, [id], callback);
}

// Get response time chart data for a specific monitor (last 24 hours, 10-minute intervals)
function getMonitorResponseTimeChartData(id, callback) {
  const query = `
    SELECT 
      strftime('%H:%M', checked_at) as time,
      AVG(response_time) as avgResponse
    FROM monitor_history
    WHERE monitor_id = ? 
    AND checked_at > datetime('now', '-24 hours')
    GROUP BY datetime(checked_at, '-10 minutes')
    ORDER BY checked_at ASC
  `;
  db.all(query, [id], callback);
}

function updateMonitor(id, name, url, type = 'http', callback) {
  const stmt = db.prepare('UPDATE monitors SET name = ?, url = ?, type = ? WHERE id = ?');
  stmt.run([name, url, type, id], callback);
  stmt.finalize();
}

function toggleMonitorPause(id, paused, callback) {
  const stmt = db.prepare('UPDATE monitors SET paused = ? WHERE id = ?');
  stmt.run([paused ? 1 : 0, id], callback);
  stmt.finalize();
}

module.exports = {
  db,
  getAllMonitors,
  addMonitor,
  deleteMonitor,
  updateMonitorStatus,
  getUptimePercentage,
  getUptimeChartData,
  getResponseTimeChartData,
  getMonitorHistory,
  updateMonitor,
  toggleMonitorPause,
  getMonitorUptimeChartData,
  getMonitorResponseTimeChartData
};