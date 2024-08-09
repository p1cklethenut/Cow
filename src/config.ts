require('dotenv').config();

const config = {
  ACCESS_TOKEN: process.env.ACCESS_TOKEN || null,
  DEVMODE: process.env.DEVMODE || null,
  DEVLOG_URL: process.env.DEVLOG_URL || null,
  EXTERNAL_URL: process.env.EXTERNAL_URL || null,
  LOGGING_ID: process.env.LOGGING_ID || null,
  PROCESS_PORT: process.env.PORT || 3000,
  RATE_LIMIT: process.env.RATE_LIMIT_WINDOW_MS && process.env.RATE_LIMIT_MAX ? {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(process.env.RATE_LIMIT_MAX),
  } : null,
  ENVTIMEBLOCK: parseInt(process.env.ENVTIMEBLOCK || '0'),
  VERSION: require("../version.json").version,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || null,
  DATABASE_BACKUP_URL: process.env.DATABASE_BACKUP_URL || null,
};

module.exports = config;
