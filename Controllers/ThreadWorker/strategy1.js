const { Worker } = require('worker_threads');
const path = require('path');
const AllData = require('../../services/AllData');
 
const { setLogger } = require('../../logger');
const logger = setLogger("Strategy_3", "logs/Betting_data.log");
const activeWorkers = new Map();
 
const fetchStrategy1 = async (sessionToken, marketId, amount) => {
    try {
        logger.info("Starting Strategy 1 in Worker Thread...");
 
        // Fetch required data
        const allData = AllData.getAllData();
        const matchData = allData.matchh;
 
 
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
 
                const workerState = activeWorkers.get(worker);
                if (!workerState) return; // Worker not found in our tracking map
 
               
                if (result.success) {
                    // Process back response
                    if (result.backResponse && !workerState.backResolved) {
                        logger.info("Received back bet response from worker");
                        AllData.backplaceorder(result.backResponse);
                        AllData.data.BackAmount = result.backStack;
                        logger.info("Result of BackStake" + result.backStack);
                       
                     
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
                         logger.info("Received lay bet response from worker");
                        AllData.layplaceorder(result.layResponse);
                        AllData.data.layAmount = result.layStake;
                       
                        workerState.layResolved = true;
                        activeWorkers.set(worker, workerState);
                       
                    }
                } else if (!workerState.backResolved) {
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
                logger.error("Worker Error:", err);
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
                    logger.error(`Worker stopped with exit code ${code}`);
                   
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
                    logger.info(`Worker for market ${marketId} timed out after 5 minutes waiting for back response`);
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
        logger.error("Error in Strategy 1 Worker Thread:" + err);
        throw err; // Propagate the error
    }
};
 
module.exports = { fetchStrategy1 };
 
 
 
 
 
 
 
 