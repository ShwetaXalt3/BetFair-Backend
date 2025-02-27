const { Worker } = require('worker_threads');
const path = require('path');
const AllData = require('../../services/AllData');

const activeWorkers = new Map(); // Using Map to track workers and their state

const fetchStrategy3 = async (sessionToken, marketId, amount) => {
    try {
        const allData = AllData.getAllData();
        const matchData = allData.matchh;
        console.log("Starting Strategy 3 in Worker Thread...");

        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'workerStrategy3.js'));
            
            // Track this worker with its market ID
            activeWorkers.set(worker, { 
                marketId, 
                backResolved: false,
                layResolved: false
            });

            worker.postMessage({ sessionToken, marketId, amount, matchData });

            worker.on("message", (result) => {
                AllData.getLastPrice(result.backBetPrice)
                // console.log("------------bgfb--" , result);

                
                const workerState = activeWorkers.get(worker);
                
                if (!workerState) return; // Worker not found in our tracking map
                
                if (result.success) {
                    // Process back response
                    if (result.backResponse && !workerState.backResolved) {
                        console.log("Received back bet response from worker");
                        AllData.backplaceorder(result.backResponse);
                        AllData.data.BackAmount = result.backStake;

                     
                        
                        
                        // Mark back as resolved and immediately resolve promise with back response
                        workerState.backResolved = true;
                        activeWorkers.set(worker, workerState);
                        
                        // Resolve with the back response immediately
                        resolve({
                            success: true,
                            backResponse: result.backResponse,
                            message: "Back bet placed successfully, lay bet monitoring in progress"
                        });
                    }
                    
                  
                    if (result.layResponse && !workerState.layResolved) {
                        console.log("Received lay bet response from worker");
                        AllData.layplaceorder(result.layResponse);
                        AllData.data.layAmount = result.layStake;
                        // console.log("---------dfd",result);
                        
                       
                        workerState.layResolved = true;
                        activeWorkers.set(worker, workerState);
                       
                        console.log("Lay bet completed for market:", marketId);
                    }
                } else if (!workerState.backResolved) {
                    // Error before back response - resolve with error
                    workerState.backResolved = true;
                    workerState.layResolved = true; // Mark both as resolved to prevent further processing
                    activeWorkers.set(worker, workerState);
                    
                    resolve({
                        success: false,
                        reason: result.reason || result.error || 'Unknown error'
                    });
                }
            });

            worker.on("error", (err) => {
                console.error("Worker Error:", err);
                const workerState = activeWorkers.get(worker);
                
                if (!workerState || workerState.backResolved) {
                    return; // Already handled this worker's back response
                }
                
                workerState.backResolved = true;
                activeWorkers.set(worker, workerState);
                reject(err);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                    
                    // If the worker exited abnormally and we haven't resolved back yet, resolve with an error
                    const workerState = activeWorkers.get(worker);
                    if (workerState && !workerState.backResolved) {
                        workerState.backResolved = true;
                        activeWorkers.set(worker, workerState);
                        resolve({
                            success: false,
                            reason: `Worker exited with code ${code}`
                        });
                    }
                }
                
                activeWorkers.delete(worker);
            });
            
            // Set a timeout to prevent hanging workers
            setTimeout(() => {
                const workerState = activeWorkers.get(worker);
                if (workerState && !workerState.backResolved) {
                    console.log(`Worker for market ${marketId} timed out after 5 minutes waiting for back response`);
                    worker.terminate();
                    workerState.backResolved = true;
                    activeWorkers.set(worker, workerState);
                    resolve({
                        success: false,
                        reason: 'Worker timed out after 5 minutes waiting for back response'
                    });
                }
            }, 5 * 60 * 1000); // 5 minute timeout for back response
        });

    } catch (err) {
        console.error("Error in Strategy 3 Worker Thread:", err);
        throw err;
    }
};

module.exports = { fetchStrategy3 };