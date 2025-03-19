import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const transports = []
if (process.env.LOG_TO_FILE === 'true') {
    const logFile = path.join(logDir, 'app.log')
    console.log(`Logging is enabled, and will be present in the file: ${logFile}`)
    transports.push(
        new winston.transports.File({
            filename: logFile,
            level: process.env.LOG_LEVEL ??  'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ??  'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports,
});

export default logger;
