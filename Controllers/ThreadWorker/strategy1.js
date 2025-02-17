const { Worker } = require('worker_threads');
const path = require('path');
const AllData = require('../../services/AllData')

const fetchStrategy1 = async (sessionToken, marketId, amount) => {
    try {

        const allData = AllData.getAllData();
        const matchData = allData.matchh;
        
        console.log("Starting Strategy 1 in Worker Thread...");
        
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'workerStrategy1.js'));
            
            // console.log(matchData);
            worker.postMessage({ sessionToken, marketId, amount , matchData });

            worker.on("message", (result) => {
                console.log("Worker Result:", result);
                resolve(result);
            });

            worker.on("error", (err) => {
                console.error("Worker Error:", err);
                reject(err);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
            });
        });

    } catch (err) {
        console.error("Error in Strategy 1 Worker Thread:", err);
    }
};

module.exports = { fetchStrategy1 };
