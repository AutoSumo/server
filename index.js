import { getQuickJS } from 'quickjs-emscripten';
import {promises as fs} from 'fs';
import BotManager from './BotManager.js';

async function main() {
    const QuickJS = await getQuickJS()
    const vm = QuickJS.newContext()

    vm.newFunction('moveMotors', (leftHandle, rightHandle) => {
        const left = vm.getNumber(leftHandle);
        const right = vm.getNumber(rightHandle);
        const promise = vm.newPromise();
        setTimeout(() => {
            console.log(`Left: ${left}, Right: ${right}`);
            promise.resolve();
        }, 100);
        promise.settled.then(vm.runtime.executePendingJobs);
        return promise.handle;
    }).consume((handle) => vm.setProp(vm.global, 'moveMotors', handle));


    vm.newFunction('waitSeconds', (secondsHandle) => {
        const seconds = vm.getNumber(secondsHandle);
        const promise = vm.newPromise();
        setTimeout(() => {
            promise.resolve();
        }, seconds * 1000);
        promise.settled.then(vm.runtime.executePendingJobs);
        return promise.handle;
    }).consume((handle) => vm.setProp(vm.global, 'waitSeconds', handle));

    const code = await fs.readFile('./robotCode.js', 'utf8');
    console.log(code);

    const result = vm.evalCode(code);
    const promiseHandle = vm.unwrapResult(result);

    const resolvedResult = await vm.resolvePromise(promiseHandle);
    promiseHandle.dispose();
    const resolvedHandle = vm.unwrapResult(resolvedResult);
    resolvedHandle.dispose();

    vm.dispose()
}

//main();

const botManager = new BotManager(8090);

