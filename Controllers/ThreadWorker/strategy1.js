const { Worker } = require('worker_threads');
const path = require('path');
const AllData = require('../../services/AllData');

// Set to track active worker threads
const activeWorkers = new Map();

const fetchStrategy1 = async (sessionToken, marketId, amount) => {
    try {
        console.log("Starting Strategy 1 in Worker Thread...");

        // Fetch required data
        const allData = AllData.getAllData();
        const matchData = allData.matchh;

        // if (!matchData || !matchData.result || !Array.isArray(matchData.result)) {
        //     throw new Error("Invalid match data.");
        // }

        return new Promise((resolve, reject) => {
            // Create a new worker thread
            const worker = new Worker(path.join(__dirname, 'workerStrategy1.js'));

            // Track the worker thread
            activeWorkers.set(worker, { 
                marketId, 
                backResolved: false,
                layResolved: false
            });

            // Send data to the worker thread
            worker.postMessage({ sessionToken, marketId, amount, matchData });

            // Listen for messages from the worker thread
            worker.on("message", (result) => {
                AllData.getLastPrice(result. back_bet_price)
                // console.log(result);

                const workerState = activeWorkers.get(worker);
                if (!workerState) return; // Worker not found in our tracking map

                
                if (result.success) {
                    // Process back response
                    if (result.backResponse && !workerState.backResolved) {
                        console.log("Received back bet response from worker");
                        AllData.backplaceorder(result.backResponse);
                        AllData.data.BackAmount = result.backStack;
                        console.log("-----------" , result.backStack);
                        
                     
                        
                        
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
                        console.log("-----------dgfg" ,result.layStake);

                        // console.log("---------dfd",result);
                        
                       
                        workerState.layResolved = true;
                        activeWorkers.set(worker, workerState);
                       
                        // console.log("Lay bet completed for market:", marketId);
                        // return ;
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
        

            // Handle worker errors
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
        console.error("Error in Strategy 1 Worker Thread:", err);
        throw err; // Propagate the error
    }
};

module.exports = { fetchStrategy1 };



 
 
