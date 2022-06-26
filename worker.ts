import { parentPort, workerData } from 'worker_threads';

function fibo(n) {
  if (n < 2) return 1;
  else return fibo(n - 2) + fibo(n - 1);
}

parentPort.postMessage(fibo(workerData.value));

// console.log('task');
// const time = Date.now();
// const promise = new Promise((res) => {
//   const worker = new Worker('./worker.js', {
//     workerData: {
//       value: 45,
//       path: './worker.ts',
//     },
//   });
//   worker.on('message', (result) => {
//     res(result);
//   });
// });
// await promise;
// return Date.now() - time;
