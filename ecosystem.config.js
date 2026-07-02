module.exports = {
  apps: [
    {
      name: "indianexaminfo-frontend",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/indianexaminfo-frontend",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
