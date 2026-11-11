// pm2 : « pm2 start ecosystem.config.js » depuis ~/s9-sauvegarde. Une sauvegarde part tout de suite,
// puis chaque dimanche à 5 h (une heure après Iloh) (heure du serveur). Entre deux, le service apparaît « stopped » : c'est normal.
module.exports = { apps: [{
  name: 's9-sauvegarde',
  script: 'sauvegarde.js',
  cwd: __dirname,
  env: { DST_KEY: process.env.HOME + '/secrets/s9-interact-cle.json', TZ: 'Europe/Paris' },
  cron_restart: '0 5 * * 0',
  autorestart: false,
}] };
