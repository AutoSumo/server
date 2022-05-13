import {WebSocket} from 'ws';
import {EventEmitter} from 'events';

export default class ArenaManager extends EventEmitter {
    constructor() {
        super();

        this.lastSeen = [];

        this.ws = new WebSocket(`ws://localhost:7844`);
        this.ws.on('open', () => {
            console.log('Opened arena websocket!');
        });
        this.ws.on('message', data => {
            const message = data.toString()
            try {
                const tags = JSON.parse(message);
                for(const tag of tags) {
                    const existing = this.lastSeen.find(t => t.id === tag.id);
                    if(existing === undefined) {
                        this.lastSeen.push(tag);
                    } else {
                        existing.x = tag.x;
                        existing.y = tag.y;
                        if(existing.in && !tag.in) {
                            this.emit('leave', tag.id);
                        }
                        existing.in = tag.in;
                    }
                }
            } catch(ignored) {}
        });
    }
}
