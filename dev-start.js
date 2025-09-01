#!/usr/bin/env node

/**
 * Cross-platform development startup script
 * Handles both Windows and Unix-like systems
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(` ${message}`, 'bright');
  log(`${'='.repeat(50)}`, 'cyan');
}

function checkNodeModules(dir) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

function installDependencies(dir, name) {
  return new Promise((resolve, reject) => {
    log(`Installing dependencies for ${name}...`, 'yellow');
    
    const npm = spawn('npm', ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: isWindows
    });

    npm.on('close', (code) => {
      if (code === 0) {
        log(`✓ Dependencies installed for ${name}`, 'green');
        resolve();
      } else {
        log(`✗ Failed to install dependencies for ${name}`, 'red');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

function startService(dir, name, command, args = []) {
  return new Promise((resolve, reject) => {
    log(`Starting ${name}...`, 'yellow');
    
    const service = spawn(command, args, {
      cwd: dir,
      stdio: 'inherit',
      shell: isWindows
    });

    service.on('error', (err) => {
      log(`✗ Failed to start ${name}: ${err.message}`, 'red');
      reject(err);
    });

    // Give it a moment to start
    setTimeout(() => {
      log(`✓ ${name} started`, 'green');
      resolve(service);
    }, 2000);
  });
}

async function main() {
  try {
    logHeader('XBLADE Development Environment Setup');
    
    const backendDir = path.join(__dirname, 'backend');
    const frontendDir = path.join(__dirname, 'frontend');

    // Check if directories exist
    if (!fs.existsSync(backendDir)) {
      log('✗ Backend directory not found', 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync(frontendDir)) {
      log('✗ Frontend directory not found', 'red');
      process.exit(1);
    }

    // Check and install dependencies
    logHeader('Checking Dependencies');
    
    if (!checkNodeModules(backendDir)) {
      await installDependencies(backendDir, 'Backend');
    } else {
      log('✓ Backend dependencies already installed', 'green');
    }

    if (!checkNodeModules(frontendDir)) {
      await installDependencies(frontendDir, 'Frontend');
    } else {
      log('✓ Frontend dependencies already installed', 'green');
    }

    // Start services
    logHeader('Starting Services');
    
    log('Starting backend server...', 'blue');
    const backendProcess = await startService(backendDir, 'Backend', 'npm', ['run', 'dev']);

    log('Starting frontend server...', 'blue');
    const frontendProcess = await startService(frontendDir, 'Frontend', 'npm', ['run', isWindows ? 'start:windows' : 'start']);

    logHeader('Development Environment Ready');
    log('Backend: http://localhost:8080', 'green');
    log('Frontend: http://localhost:3000', 'green');
    log('\nPress Ctrl+C to stop all services', 'yellow');

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      log('\nShutting down services...', 'yellow');
      
      if (backendProcess) backendProcess.kill();
      if (frontendProcess) frontendProcess.kill();
      
      setTimeout(() => {
        log('✓ All services stopped', 'green');
        process.exit(0);
      }, 1000);
    });

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };