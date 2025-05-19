module.exports = {
    apps: [{
      name: 'monetai-dev',
      script: 'build/server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      output: '/var/log/monetai-dev/out.log',
      error: '/var/log/monetai-dev/error.log',
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }]
  }