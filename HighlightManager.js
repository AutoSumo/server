import { throttle } from 'throttle-debounce';
import {WebSocket} from 'ws';

export default class HighlightManager {
    constructor() {
        this.ws = new WebSocket('wss://autosumo.techchrism.me/code/upload/');

        this.highlight = throttle(100, fullID => {
            const split = fullID.split('-');
            const id = split.shift();
            const statement = split.join('');

            this.ws.send(JSON.stringify({
                type: 'highlight',
                codeID: id,
                statement
            }));
        });
    }

    async waitForReady(id) {
        return new Promise((resolve, reject) => {
            this.ws.once('open', () => {
                this.ws.send(JSON.stringify({
                    type: 'register',
                    id
                }));
                console.log('⏺️ Opened highlight websocket!');
                resolve();
            });
        });
    }
}
