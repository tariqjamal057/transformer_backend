const fs = require('fs');
const path = require('path');

const logError = (error) => {
  const logMessage = `[${new Date().toISOString()}] ${error.stack || error}\n`;
  fs.appendFile(path.join(__dirname, '..', 'error.log'), logMessage, (err) => {
    if (err) {
      console.error('Failed to write to error log:', err);
    }
  });
};

module.exports = { logError };
