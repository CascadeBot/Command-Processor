import { hello as hello2 } from 'file2.js';

log(hello2());

log('-- starting api tests');
log(hello());
try {
  log(await ping());
} catch (e) {
  log(e.message);
}
log(await ping('pongalong!'));
