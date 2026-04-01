module.exports = {
  apps: [
    {
      name: 'dialysis-server',
      script: './src/index.js',
      cwd: 'C:\\dialysis-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: '112dc7ccad8d34510a2299e55a97e0c0764dea3c1e8b81f3043865673bded7e4',
        DB_PATH: 'D:\\dialysis-app\\data\\dialysis.db',
        BACKUP_DIR: 'D:\\dialysis-app\\data\\backups',
        STATIC_PATH: 'D:\\dialysis-app\\dist',
      },
      error_file: 'D:\\dialysis-app\\logs\\error.log',
      out_file: 'D:\\dialysis-app\\logs\\out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      restart_delay: 5000,
      autorestart: true,
      watch: true,
    },
  ],
}
