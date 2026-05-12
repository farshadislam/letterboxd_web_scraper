const { parentPort, workerData } = require("worker_threads");

let result = 0;

for (let i = 0; i < 10000000000 / workerData.thread_count; i++) { // Only going to count up until it reaches a fraction of the whole way, other threads will handle the rest
  result++;
}

parentPort.postMessage(result);