const winston = require('winston');
const path = require('path');
const fs = require('fs');
 
function setLogger(loggerName, logFile, level = 'info') {
    /**
     * Sets up a logger to capture and store logs in a file and output them to the console.
     *
     * @param {string} loggerName - The name of the logger.
     * @param {string} logFile - The file path where the logs will be stored.
     * @param {string} [level='info'] - The logging level (default is 'info').
     * @returns {winston.Logger} - The configured logger instance.
     */
 
    const logDir = path.dirname(logFile); // Extract the directory from the log file path
 
    // Ensure the logs directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
 
    // Create a logger instance
    const logger = winston.createLogger({
        level, // Set the logging level
        format: winston.format.combine(
            winston.format.timestamp(), // Add timestamp to log messages
            winston.format.printf(({ timestamp, level, message }) =>
                `${timestamp} - ${level.toUpperCase()} - ${message}`
            )
        ),
        transports: [
            new winston.transports.File({ filename: logFile }), // Log to a file
            new winston.transports.Console() // Also log to the console
        ]
    });
 
    return logger; // Return the configured logger
}
 
function setupLogger(match, strategyName) {
    /**
     * Creates a logger for a specific match and strategy.
     *
     * @param {string} match - Match identifier.
     * @param {string} strategyName - Strategy identifier.
     * @returns {winston.Logger} - Configured logger instance.
     */
 
    const logFilename = `${match} with ${strategyName}.log`; // Create a unique filename based on match details
    const logDir = "logs"; // Define the logs directory
 
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
 
    // Full path of the log file
    const logFilePath = path.join(logDir, logFilename);
 
    // Create a new logger
    const logger = winston.createLogger({
        level: 'info', // Default logging level
 
        format: winston.format.combine(
            winston.format.timestamp(), // Add timestamp
            winston.format.printf(({ timestamp, level, message }) =>
                `${timestamp} - ${level.toUpperCase()} - ${message}`
            )
        ),
 
        transports: [
            new winston.transports.File({ filename: logFilePath }), // File handler
            new winston.transports.Console() // Console handler
        ]
    });
 
    return logger; // Return the logger instance
}
 
module.exports = { setLogger, setupLogger };
 
 