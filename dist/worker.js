"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
function fibo(n) {
    if (n < 2)
        return 1;
    else
        return fibo(n - 2) + fibo(n - 1);
}
worker_threads_1.parentPort.postMessage(fibo(worker_threads_1.workerData.value));
//# sourceMappingURL=worker.js.map