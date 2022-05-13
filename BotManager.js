import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import Bot from './Bot.js';

export default class BotManager extends EventEmitter {
    constructor(port) {
        super();
        this.port = port;
        this.bots = [];
        this.server = new WebSocketServer({
            port
        });

        this.server.on('connection', ws => {
            const bot = new Bot(ws);
            bot.on('connect', () => {
                this.bots.push(bot);
                this.emit('connect', bot);

                ws.on('close', () => {
                    this.bots = this.bots.filter(b => b !== bot);
                });
            });
        });

        console.log(`Started listening on ${port}!`);
    }
}
