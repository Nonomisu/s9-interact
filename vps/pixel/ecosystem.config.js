// pm2 : « pm2 start ecosystem.config.js » depuis ~/s9-pixel. Tourne en continu (accroches toutes les 20 minutes, jamais entre 2 h et 10 h).
module.exports = { apps: [{
  name: 's9-pixel',
  script: 'pixel.js',
  cwd: __dirname,
  env: { DST_KEY: process.env.HOME + '/secrets/s9-interact-cle.json', TZ: 'Europe/Paris' },
  max_memory_restart: '150M',
  restart_delay: 10000,
}] };
