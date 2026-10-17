# FixAround — Deployment Guide

## Table of Contents

1. [Local Development (Windows)](#local-development-windows)
2. [MySQL Setup](#mysql-setup)
3. [Production Build](#production-build)
4. [Linux Server Deployment](#linux-server-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [HTTPS Setup](#https-setup)
7. [PM2 Process Management](#pm2-process-management)
8. [MySQL Backups](#mysql-backups)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Local Development (Windows)

### Prerequisites
- Node.js 18+ LTS: https://nodejs.org
- MySQL 8.0+: https://dev.mysql.com/downloads/installer/
- Git: https://git-scm.com
- VS Code (recommended): https://code.visualstudio.com

### Step-by-step Setup

```powershell
# 1. Clone repository
git clone <repository-url>
cd fixaround

# 2. Install all dependencies
npm run install:all

# 3. Create server .env
copy .env.example server\.env
# Edit server\.env with your MySQL credentials

# 4. Set up database
# Option A: Using MySQL Workbench
# Open MySQL Workbench → Connect → File → Run SQL Script → Select database/schema.sql
# Then run database/seed.sql

# Option B: Using MySQL CLI
mysql -u root -p < database/schema.sql
mysql -u root -p fixaround_db < database/seed.sql

# Option C: Using npm scripts (requires .env configured)
npm run db:schema
npm run db:seed

# 5. Start development servers
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Environment Variables

Edit `server/.env`:
```ini
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fixaround_db
JWT_SECRET=dev-secret-change-in-production
```

---

## MySQL Setup

### Using MySQL Workbench

1. Download and install MySQL 8.0+ with MySQL Workbench
2. Open MySQL Workbench → Create new connection
3. Host: `localhost`, Port: `3306`, Username: `root`
4. Test Connection → OK
5. Open connection → File → Open SQL Script
6. Run `database/schema.sql` first
7. Run `database/seed.sql` second

### Using MySQL CLI

```bash
# Connect to MySQL
mysql -u root -p

# Create database and tables
source /path/to/fixaround/database/schema.sql;

# Load seed data
source /path/to/fixaround/database/seed.sql;

# Verify
USE fixaround_db;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### Create Application User (Production)

```sql
-- Don't use root in production!
CREATE USER 'fixaround_app'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON fixaround_db.* TO 'fixaround_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## Production Build

### Build Frontend
```bash
cd client
npm run build
# Output: client/dist/
```

### Prepare Backend
```bash
cd server
npm ci --production
```

### Server .env (Production)
```ini
PORT=3000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
DB_HOST=localhost
DB_PORT=3306
DB_USER=fixaround_app
DB_PASSWORD=strong_production_password
DB_NAME=fixaround_db
JWT_SECRET=generate-a-64-char-random-string
JWT_EXPIRES_IN=24h
PLATFORM_COMMISSION_PERCENT=15
TECHNICIAN_RESPONSE_TIMEOUT_SECONDS=300
TECHNICIAN_MAX_ASSIGNMENT_ATTEMPTS=3
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Linux Server Deployment

### Server Requirements
- Ubuntu 22.04 LTS (or similar)
- 2+ GB RAM
- Node.js 18+ LTS
- MySQL 8.0+
- Nginx
- Certbot (for HTTPS)

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for HTTPS
sudo apt install -y certbot python3-certbot-nginx
```

### Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone <repository-url> fixaround
sudo chown -R $USER:$USER /opt/fixaround
cd /opt/fixaround

# Install dependencies
npm run install:all

# Set up database
mysql -u root -p < database/schema.sql
mysql -u root -p fixaround_db < database/seed.sql

# Configure environment
cp .env.example server/.env
nano server/.env
# Set production values

# Build frontend
cd client && npm run build && cd ..
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/fixaround`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (static files from Vite build)
    root /opt/fixaround/client/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fixaround /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## HTTPS Setup

```bash
# Obtain SSL certificate with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## PM2 Process Management

### Start Application

```bash
cd /opt/fixaround/server

# Start with PM2
pm2 start src/server.js --name fixaround-api --env production

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup systemd
# Run the command it outputs

# Monitor
pm2 status
pm2 logs fixaround-api
pm2 monit
```

### PM2 Ecosystem File (optional)

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'fixaround-api',
    script: './server/src/server.js',
    instances: 1,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
```

---

## MySQL Backups

### Automated Daily Backup

Create `/opt/fixaround/scripts/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/fixaround/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="fixaround_db_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

# Create compressed backup
mysqldump -u fixaround_app -p'password' fixaround_db | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: ${FILENAME}"
```

Schedule with cron:
```bash
chmod +x /opt/fixaround/scripts/backup.sh
crontab -e
# Add: 0 2 * * * /opt/fixaround/scripts/backup.sh
```

### Restore from Backup
```bash
gunzip < /opt/fixaround/backups/fixaround_db_20261017.sql.gz | mysql -u root -p fixaround_db
```

---

## Monitoring

### Health Check Endpoint
The API provides a health check at:
```
GET /api/v1/health
```

### Log Monitoring
```bash
# Application logs
pm2 logs fixaround-api

# Nginx access logs
tail -f /var/log/nginx/access.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Database Monitoring
```sql
-- Active connections
SHOW PROCESSLIST;

-- Table sizes
SELECT table_name, ROUND(data_length/1024/1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'fixaround_db'
ORDER BY data_length DESC;
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` to MySQL | Verify MySQL is running: `sudo systemctl status mysql` |
| Port 3000 in use | Check: `lsof -i :3000` and kill the process |
| JWT token invalid | Check `JWT_SECRET` matches between restarts |
| CORS errors | Verify `CLIENT_URL` in `.env` matches frontend URL |
| Database not found | Run `npm run db:schema` or source schema.sql |
| Permission denied | Check file ownership: `chown -R $USER:$USER /opt/fixaround` |
| 502 Bad Gateway | Check if Node.js server is running: `pm2 status` |

### Reset Database
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS fixaround_db;"
npm run db:schema
npm run db:seed
```
