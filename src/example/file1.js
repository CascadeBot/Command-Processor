import { hello as hello2 } from 'file2.js';

log(hello2());

log('-- starting api tests');
log(hello());
log(await ping());
log(await ping('pongalong!'));
