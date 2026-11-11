// pm2 : « pm2 start ecosystem.config.js » depuis ~/s9-chronique. Lancé chaque heure le dimanche ;
// la chronique ne part qu'à 20 h (heure de Paris), une fois par semaine. Entre deux, « stopped » : c'est normal.
module.exports = { apps: [{
  name: 's9-chronique',
  script: 'chronique.js',
  cwd: __dirname,
  env: { DST_KEY: process.env.HOME + '/secrets/s9-interact-cle.json', TZ: 'Europe/Paris' },
  cron_restart: '5 * * * 0',
  autorestart: false,
}] };
