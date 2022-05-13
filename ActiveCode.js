import {getQuickJS} from 'quickjs-emscripten';
import {EventEmitter} from 'events';

export default class ActiveCode extends EventEmitter {
    constructor(text, botID, botManager) {
        super();
        this.text = text;
        this.botID = botID;
        this.botManager = botManager;
        this.running = false;

        this.latestLeft = null;
        this.latestRight = null;
        this.latestServo = null;

        this.target = null;
        for(const bot of botManager.bots) {
            if(bot.botID === botID) {
                this.target = bot;
                bot.on('disconnect', () => {
                    this.target = null;
                });
                break;
            }
        }

        botManager.on('connect', bot => {
            if(bot.botID === botID) {
                this.target = bot;
                if(this.latestLeft !== null && this.latestRight !== null) {
                    bot.setPower(this.latestLeft, this.latestRight);
                }
                if(this.latestServo !== null) {
                    bot.sendServo(this.latestServo);
                }
                bot.on('disconnect', () => {
                    this.target = null;
                });
            }
        });
    }

    async start() {
        const QuickJS = await getQuickJS();
        const vm = QuickJS.newContext();

        vm.newFunction('moveMotors', (leftHandle, rightHandle) => {
            const left = vm.getNumber(leftHandle);
            const right = vm.getNumber(rightHandle);

            this.latestLeft = left;
            this.latestRight = right;
            if(this.target !== null) {
                this.target.setPower(left, right);
            }
        }).consume((handle) => vm.setProp(vm.global, 'moveMotors', handle));

        vm.newFunction('moveServo', (angleHandle) => {
            const angle = vm.getNumber(angleHandle);

            this.latestServo = angle;
            if(this.target !== null) {
                this.target.sendServo(angle);
            }
        }).consume((handle) => vm.setProp(vm.global, 'moveServo', handle));

        vm.newFunction('getLidar', () => {
            return vm.newNumber(this.target.lidar);
        }).consume((handle) => vm.setProp(vm.global, 'getLidar', handle));

        vm.newFunction('getIR', (sideHandle) => {
            const side = vm.getString(sideHandle);
            if(side === 'left') {
                return vm.newNumber(this.target.leftIR);
            } else {
                return vm.newNumber(this.target.rightIR);
            }
        }).consume((handle) => vm.setProp(vm.global, 'getIR', handle));

        vm.newFunction('log', (textHandle) => {
            const text = vm.getString(textHandle);
            console.log(text);
        }).consume((handle) => vm.setProp(vm.global, 'log', handle));

        vm.newFunction('waitSeconds', (secondsHandle) => {
            const seconds = vm.getNumber(secondsHandle);
            secondsHandle.dispose();
            const promise = vm.newPromise();
            setTimeout(() => {
                promise.resolve();
            }, seconds * 1000);
            promise.settled.then(vm.runtime.executePendingJobs);
            return promise.handle;
        }).consume((handle) => vm.setProp(vm.global, 'waitSeconds', handle));

        const result = vm.evalCode(this.text);
        const promiseHandle = vm.unwrapResult(result);

        const resolvedResult = await vm.resolvePromise(promiseHandle);
        promiseHandle.dispose();
        const resolvedHandle = vm.unwrapResult(resolvedResult);
        resolvedHandle.dispose();

        this.running = false;
        this.emit('stopped');
        this.killTarget();
    }

    killTarget() {
        this.latestLeft = 0;
        this.latestRight = 0;
        if(this.target !== null) {
            this.target.setPower(0, 0);
            this.target.sendServo(90);
        }

        this.target = null;
        this.botID = null;
    }
}
