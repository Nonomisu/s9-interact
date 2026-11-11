// pm2 : lancer avec « pm2 start ecosystem.config.js » depuis ~/s9-notifs.
module.exports = { apps: [{
  name: 's9-notifs',
  script: 'notifs.js',
  cwd: __dirname,
  env: {
    DST_KEY: process.env.HOME + '/secrets/s9-interact-cle.json',
    VAPID_KEY: process.env.HOME + '/secrets/s9-vapid.json',
  },
  max_memory_restart: '150M',
  restart_delay: 10000,
}] };
