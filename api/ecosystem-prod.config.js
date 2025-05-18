module.exports = {
    apps: [{
      name: 'monetai-prod',
      script: 'build/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      output: '/var/log/monetai-prod/out.log',
      error: '/var/log/monetai-prod/error.log',
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }]
  }