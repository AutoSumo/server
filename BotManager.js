import { WebSocketServer } from 'ws';
import Bot from './Bot.js';

export default class BotManager {
    constructor(port) {
        this.port = port;
        this.bots = [];
        this.server = new WebSocketServer({
            port
        });

        this.server.on('connection', ws => {
            const bot = new Bot(ws);
            this.bots.push(bot);

            ws.on('close', () => {
                this.bots = this.bots.filter(b => b !== bot);
            });
        });

        console.log(`Started listening on ${port}!`);
    }
}
