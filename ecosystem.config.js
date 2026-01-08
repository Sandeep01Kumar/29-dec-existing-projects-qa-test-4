/**
 * PM2 Ecosystem Configuration File
 * 
 * This file defines the process management configuration for PM2, enabling
 * production-ready deployment with clustering, auto-restart, and monitoring.
 * 
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 *   
 * PM2 Commands:
 *   pm2 start ecosystem.config.js    - Start application
 *   pm2 stop ecosystem.config.js     - Stop application
 *   pm2 restart ecosystem.config.js  - Restart application
 *   pm2 reload ecosystem.config.js   - Zero-downtime reload
 *   pm2 delete ecosystem.config.js   - Remove from PM2 list
 *   pm2 logs                         - View application logs
 *   pm2 monit                        - Monitor processes
 * 
 * @module ecosystem.config
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  /**
   * Application configurations array
   * PM2 can manage multiple applications; this config defines one: blitzy-basic-app
   */
  apps: [
    {
      /**
       * Application name displayed in PM2 process list
       * Used for identification in pm2 commands (pm2 restart blitzy-basic-app)
       */
      name: 'blitzy-basic-app',

      /**
       * Entry point script for the application
       * PM2 will execute this file using Node.js
       */
      script: 'server.js',

      /**
       * Number of instances to spawn in cluster mode
       * 'max' will spawn one instance per available CPU core
       * Can also be a specific number: 2, 4, etc.
       */
      instances: 'max',

      /**
       * Execution mode for the application
       * 'cluster' enables load balancing across multiple instances
       * 'fork' runs a single instance (default)
       */
      exec_mode: 'cluster',

      /**
       * Automatically restart application if it crashes
       * Essential for production reliability
       */
      autorestart: true,

      /**
       * Watch for file changes and auto-restart
       * Disabled in production for stability; enable for development if needed
       */
      watch: false,

      /**
       * Maximum memory threshold before automatic restart
       * Helps prevent memory leaks from causing system instability
       * Format: '100M', '1G', etc.
       */
      max_memory_restart: '1G',

      /**
       * Delay between automatic restarts (milliseconds)
       * Prevents rapid restart loops in case of persistent errors
       */
      restart_delay: 4000,

      /**
       * Maximum number of consecutive unstable restarts before stopping
       * Prevents infinite restart loops for applications that fail to start
       */
      max_restarts: 10,

      /**
       * Minimum uptime (milliseconds) to consider application as 'started'
       * Helps distinguish between immediate crashes and runtime errors
       */
      min_uptime: 5000,

      /**
       * Time to wait (milliseconds) before sending SIGKILL after SIGTERM
       * Allows graceful shutdown handlers to complete
       */
      kill_timeout: 5000,

      /**
       * Wait for application to be ready before considering it 'online'
       * Set to true if app signals ready via process.send('ready')
       */
      wait_ready: false,

      /**
       * Listen timeout (milliseconds) for cluster mode
       * Time to wait for workers to be ready
       */
      listen_timeout: 3000,

      /**
       * Development environment configuration
       * Activated with: pm2 start ecosystem.config.js --env development
       */
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },

      /**
       * Production environment configuration
       * Activated with: pm2 start ecosystem.config.js --env production
       * This is also used when no --env flag is specified
       */
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },

      /**
       * Error log file path
       * All stderr output will be written here
       */
      error_file: './logs/error.log',

      /**
       * Standard output log file path
       * All stdout output will be written here
       */
      out_file: './logs/out.log',

      /**
       * Combined log file path
       * Both stdout and stderr merged into single file
       */
      log_file: './logs/combined.log',

      /**
       * Merge logs from all cluster instances into single files
       * When false, PM2 creates separate log files per instance
       */
      merge_logs: true,

      /**
       * Add timestamp prefix to all log entries
       * Format: YYYY-MM-DDTHH:mm:ss
       */
      time: true,

      /**
       * Log date format for file rotation
       * Used when log rotation is enabled
       */
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      /**
       * Custom interpreter (optional)
       * Uncomment to use a specific Node.js version
       */
      // interpreter: '/usr/bin/node',

      /**
       * Node.js arguments (optional)
       * Uncomment to add Node.js specific flags
       */
      // node_args: ['--max-old-space-size=4096'],

      /**
       * Working directory for the application
       * Defaults to the directory containing this config file
       */
      cwd: './',

      /**
       * Append environment name to application name in PM2 list
       * Helps distinguish between environments when running multiple
       */
      append_env_to_name: false,

      /**
       * Source map support for stack traces
       * Enable if using transpiled code (TypeScript, Babel)
       */
      source_map_support: false
    }
  ]
};
