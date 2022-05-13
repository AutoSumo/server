import { EventEmitter } from 'events';

export default class Bot extends EventEmitter {
    constructor(ws) {
        super();
        this.ws = ws;

        this.leftPower = 0;
        this.rightPower = 0;
        this.leftIR = false;
        this.rightIR = false;
        this.lidar = 0;
        this.lidarStatus = 0;
        this.powerLastSent = 0;
        this.botID = null;

        this.motorInterval = setInterval(() => {
            const now = (new Date()).getTime();
            if(now - this.powerLastSent > 500) {
                this.sendPower();
            }
        }, 500);

        ws.on('close', () => {
            console.log('Bot disconnected!');
            clearInterval(this.motorInterval);
            this.emit('disconnect');
        });

        ws.on('message', (data, isBinary) => {
            if(isBinary) {
                if(data.length < 1) return;
                const packetID = data[0];

                if(packetID === 2 && data.length >= 3) {
                    // IR packet
                    this.leftIR = data[1] !== 0x00;
                    this.rightIR = data[2] !== 0x00;
                } else if(packetID === 4 && data.length >= 3) {
                    // Lidar packet
                    this.lidar = data[1]
                    this.lidarStatus = data[2];
                }
            } else {
                if(this.botID === null) {
                    this.botID = data;
                    console.log(`Bot "${this.botID}" connected`);
                    this.emit('connect');
                }
            }
        });
    }

    setPower(left, right) {
        this.leftPower = left;
        this.rightPower = right;
        this.sendPower();
    }

    sendPower() {
        this.powerLastSent = (new Date()).getTime();

        const leftPositive = (this.leftPower > 0) ? 0x01 : 0x00;
        const left = Math.abs(Math.round((this.leftPower / 100) * 128));
        const rightPositive = (this.rightPower > 0) ? 0x01 : 0x00;
        const right = Math.abs(Math.round((this.rightPower / 100) * 128));

        const buffer = Buffer.alloc(7);
        buffer.writeUInt8(0x01, 0);
        buffer.writeUInt8(leftPositive, 1);
        buffer.writeUInt16LE(left, 2);
        buffer.writeUInt8(rightPositive, 4);
        buffer.writeUInt16LE(right, 5);

        this.ws.send(buffer);
    }

    sendServo(angle) {
        const buffer = Buffer.alloc(2);
        buffer.writeUInt8(0x03, 0);
        buffer.writeUInt8(angle, 1);
        this.ws.send(buffer);
    }
}
