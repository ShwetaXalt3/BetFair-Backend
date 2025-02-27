const {Worker} = require('worker_threads')
const path = require('path');
const AllData = require('../../services/AllData');
 
const { setLogger } = require('../../logger');
const logger = setLogger("Strategy_3", "logs/Betting_data.log");
 
const fetchStrategy2 = async(sessionToken , marketId, amount) =>{
         try{
            const allData = AllData.getAllData();
            const matchData = allData.matchh;
 
            logger.info("Starting strategy 2 in worker thread..........");
 
            return new Promise((resolve , reject)=>{
                 const worker = new Worker(path.join(__dirname , 'workerStrategy2.js'))
                 
              worker.postMessage({sessionToken , marketId , amount , matchData});
 
              worker.on("message" , (result)=>{
                AllData.getLastPrice(result.firstBackOdds)
                AllData.backplaceorder(result.backResponse)
                AllData.layplaceorder(result.layResponse)
                AllData.data.BackAmount = result.amount;
               
                logger.info("Worker result : " + result);
                resolve(result);
              });
 
              worker.on("error" , (err)=>{
                logger.error("Worker Error : " + err);
                reject(err);
               
              });
              worker.on("exit" , (code)=>{
                if(code != 0){
                    logger.error(`worker stopped with exit code ${code}`);
                }
              });
            });
           
         }catch(err){
            logger.error("error in strategy 2 worker thread "+ err)
         }
}
module.exports = {fetchStrategy2}
 