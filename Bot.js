
export default class Bot {
    constructor(ws) {
        console.log('New bot connection!');
        this.ws = ws;

        this.leftPower = 0;
        this.rightPower = 0;
        this.powerLastSent = 0;

        this.motorInterval = setInterval(() => {
            const now = (new Date()).getTime();
            if(now - this.powerLastSent > 500) {
                this.sendPower();
            }
        }, 500);

        ws.on('close', () => {
            console.log('Bot disconnected!');
            clearInterval(this.motorInterval);
        });
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
}
