import BotManager from './BotManager.js';
import ActiveCode from './ActiveCode.js';
import ArenaManager from './ArenaManager.js';
import fetch from 'node-fetch';
import HighlightManager from './HighlightManager.js';
import 'dotenv/config';

async function waitForArenaConnection(arena) {
    return new Promise((resolve, reject) => {
        arena.once('connected', resolve);
    });
}

async function waitForBotConnection(botManager) {
    return new Promise((resolve, reject) => {
        botManager.once('connect', resolve);
    });
}

async function waitForArenaLeave(arena) {
    return new Promise((resolve, reject) => {
        arena.once('gone', id => {
            console.log(`🎉 ${id} has left the arena!`);
            resolve();
        });
    });
}

// From https://stackoverflow.com/a/49959557
const keypress = async () => {
    process.stdin.setRawMode(true);
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve()
    }));
}


if(process.argv.length < 3) {
    console.log('Provide ID');
    process.exit(1);
}
const fileID = process.argv[2];
console.log(`ID: "${fileID}"`);

(async () => {
    const codeResponse = await fetch(`https://autosumo.techchrism.me/code/download/${fileID}.js`);
    if(!codeResponse.ok) {
        console.log(`Status code for ${fileID} is ${codeResponse.status}`);
        process.exit(1);
    }
    const code = await codeResponse.text();
    console.group('Running code:');
    console.log(code);
    console.groupEnd();
    console.log('');

    console.log('⌛ Waiting for bot and arena connection...');
    const botManager = new BotManager(8090);
    const arena = new ArenaManager();
    const highlightManager = new HighlightManager();

    await Promise.all([
        waitForArenaConnection(arena),
        waitForBotConnection(botManager),
        highlightManager.waitForReady(process.env['ROBOT_SERVER_ID'])
    ]);
    const activeCode = new ActiveCode(code, botManager.bots[0].botID, botManager, highlightManager);

    console.log('👌 Ready! Press any key to execute');
    await keypress();
    console.log('➡️ Running!');

    await Promise.any([
        keypress(),
        activeCode.start(),
        waitForArenaLeave(arena)
    ]);

    activeCode.killTarget();
    console.log('Done!');
    setTimeout(() => {
        process.exit(0);
    }, 1000);
})();
