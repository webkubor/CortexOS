module.exports = {
  apps: [
    {
      name: 'brain-cortex-pilot',
      cwd: __dirname,
      script: 'scripts/core/auto-pilot.js',
      interpreter: 'node',
      cron_restart: '*/5 * * * *',
      autorestart: false,
      env: {
        CORTEXOS_LOG_STYLE: 'pm2'
      }
    },
    {
      name: 'brain-frontend',
      cwd: __dirname,
      script: 'pnpm',
      args: 'brain:frontend',
      interpreter: 'none',
      autorestart: true,
      env: {
        BROWSER: 'none'
      }
    }
  ]
}
