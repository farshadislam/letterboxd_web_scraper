/* 
    http://localhost:3000/blocking
    http://localhost:3000/non-blocking
*/

const express = require("express");
const { Worker } = require("worker_threads");

const app = express(); // Creates server
const port = process.env.PORT || 3000; // Readiesb port 3000
const THREADS_AVAILABLE = 10;

function addWorker() {
    const bullshit =  new Promise((resolve, reject) => { // "Promise" will return a success or failure asynchronously, represented by resolve and reject respectively
        const worker_w = new Worker("./worker-optimized.js", {
            /* Basically sends a fucking struct to the worker */
            workerData: {
                thread_count: THREADS_AVAILABLE,
            },
        });

        worker_w.on("message", (data) => {
            resolve(data);
        });

        worker_w.on("error", (err) => {
            reject(`An error occured : ${err}`);
        });
    });

    return bullshit; // Trying things this way for clarity
}

// Non-blocking route
app.get("/non-blocking", (req, res) => {
  res.status(200).send("This page is non-blocking.");
});

// Blocking route using Worker Threads
app.get("/blocking", async (req, res) => { // Signature needs to include "async" now because of the "await" usage
    const workerPromises = [];

    for (let i = 0; i < THREADS_AVAILABLE; i++) {
        workerPromises.push(addWorker());
    }

    const threadResults = await Promise.all(workerPromises);
    let total = 0;

    for (let i = 0; i < THREADS_AVAILABLE; i++) {
        total += threadResults[i];
    }

    res.status(200).send(`Result is ${total}`); // Actually writes to the website via port (200 is basically ready status)
});

// Start the server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

