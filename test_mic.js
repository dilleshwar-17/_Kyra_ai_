const mic = require('mic');
const m = mic({rate: '16000', channels: '1', debug: true, device: 'default'});
m.getAudioStream().on('error', e => console.error(e));
m.start();
setTimeout(() => { m.stop(); process.exit(); }, 2000);
