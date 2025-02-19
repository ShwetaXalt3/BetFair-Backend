const { Worker } = require('worker_threads');
const path = require('path');
const AllData = require('../../services/AllData');

const activeWorkers = new Set(); // To keep track of worker instances

const fetchStrategy3 = async (sessionToken, marketId, amount) => {
    try {
        const allData = AllData.getAllData();
        const matchData = allData.matchh;
        console.log("Starting Strategy 3 in Worker Thread...");

        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'workerStrategy3.js'));

            activeWorkers.add(worker); 

            worker.postMessage({ sessionToken, marketId, amount, matchData });

            worker.on("message", (result) => {
                console.log("Worker Result:", result);
                if (activeWorkers.has(worker)) {
                    resolve(result); // Return response of the first completed worker
                    activeWorkers.delete(worker); // Remove worker from tracking
                }
            });

            worker.on("error", (err) => {
                console.error("Worker Error:", err);
                reject(err);
                activeWorkers.delete(worker); // Cleanup on error
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
                activeWorkers.delete(worker); // Cleanup on exit
            });
        });

    } catch (err) {
        console.error("Error in Strategy 3 Worker Thread:", err);
    }
};

module.exports = { fetchStrategy3 };



// const { Worker } = require('worker_threads');
// const path = require('path');
// const AllData = require('../../services/AllData');

// const fetchStrategy3 = async (sessionToken, marketIds, amount) => {
//     try {
//         const allData = AllData.getAllData();
//         const matchData = allData.matchh;
//         console.log("Starting Strategy 3 in Worker Threads...");

//         return new Promise((resolve, reject) => {
//             const results = new Array(marketIds.length).fill(null); // Store results by index
//             let completedCount = 0; // Track how many are completed

//             marketIds.forEach((marketId, index) => {
//                 const worker = new Worker(path.join(__dirname, 'workerStrategy3.js'));

//                 worker.postMessage({ sessionToken, marketId, amount, matchData });

//                 worker.on("message", (result) => {
//                     console.log(`Worker for index ${index} completed with result:`, result);
//                     results[index] = result; // Store result at the correct index
//                     completedCount++;

//                     // If all workers have completed, resolve the promise with ordered results
//                     if (completedCount === marketIds.length) {
//                         resolve(results);
//                     }
//                 });

//                 worker.on("error", (err) => {
//                     console.error(`Worker Error at index ${index}:`, err);
//                     results[index] = { error: "Worker failed" }; // Store error at the correct index
//                     completedCount++;

//                     if (completedCount === marketIds.length) {
//                         resolve(results);
//                     }
//                 });

//                 worker.on("exit", (code) => {
//                     if (code !== 0) {
//                         console.error(`Worker at index ${index} stopped with exit code ${code}`);
//                     }
//                 });
//             });
//         });

//     } catch (err) {
//         console.error("Error in Strategy 3 Worker Threads:", err);
//     }
// };

// module.exports = { fetchStrategy3 };

