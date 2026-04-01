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
      name: 'brain-api-local',
      cwd: __dirname,
      script: 'services/brain-api/src/index.js',
      interpreter: 'node',
      autorestart: true,
      env: {
        BRAIN_API_PORT: process.env.BRAIN_API_PORT || '3679'
      }
    }
  ]
}
