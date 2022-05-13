import {promises as fs} from 'fs';
import BotManager from './BotManager.js';
import ActiveCode from './ActiveCode.js';
import ArenaManager from './ArenaManager.js';

//const botManager = new BotManager(8090);

(async () => {
    /*botManager.on('connect', async bot => {
        const code = await fs.readFile('./robotCode.js', 'utf8');
        const activeCode = new ActiveCode(code, 'bot-01', botManager);
        activeCode.on('stopped', () => {
            console.log('Active code stopped!');
        });

        await activeCode.start();
    });*/
    const arena = new ArenaManager();
    arena.on('leave', id => {
        console.log(`${id} left the arena!`);
    });
})();
