
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
        
            let storedBackResponse = null;
            let storedLayResponse = null;

            activeWorkers.add(worker); 

            worker.postMessage({ sessionToken, marketId, amount, matchData });

            worker.on("message", (result) => {
                if (result.success) {
              
                    storedBackResponse = result.backResponse;
                    storedLayResponse = result.layResponse;
                 
                    if (storedBackResponse) AllData.backplaceorder(storedBackResponse);
                    if (storedLayResponse) AllData.layplaceorder(storedLayResponse);
                    if (activeWorkers.has(worker)) {
                   
                        resolve({
                            success: true,
                            backResponse: storedBackResponse,
                            layResponse: storedLayResponse
                        });
                        activeWorkers.delete(worker);
                    }
                } else {
                    resolve({
                        success: false,
                        reason: result.reason || result.error || 'Unknown error'
                    });
                    activeWorkers.delete(worker);
                }
            });

            worker.on("error", (err) => {
                console.error("Worker Error:", err);
                reject(err);
                activeWorkers.delete(worker);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
                activeWorkers.delete(worker);
            });
        });

    } catch (err) {
        console.error("Error in Strategy 3 Worker Thread:", err);
        throw err;
    }
};

module.exports = { fetchStrategy3 };

