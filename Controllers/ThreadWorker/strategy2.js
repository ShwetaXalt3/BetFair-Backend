const {Worker} = require('worker_threads')
const path = require('path');
const AllData = require('../../services/AllData');

const fetchStrategy2 = async(sessionToken , marketId, amount) =>{
         try{
            const allData = AllData.getAllData();
            const matchData = allData.matchh;

            console.log("Starting strategy 2 in worker thread..........");

            return new Promise((resolve , reject)=>{
                 const worker = new Worker(path.join(__dirname , 'workerStrategy2.js'))
                 
              worker.postMessage({sessionToken , marketId , amount , matchData});

              worker.on("message" , (result)=>{
                console.log("Worker result : " , result);
                resolve(result);
              });

              worker.on("error" , (err)=>{
                console.error("Worker Error : " , err);
                reject(err);
                
              });
              worker.on("exit" , (code)=>{
                if(code != 0){
                    console.error(`worker stopped with exit code ${code}`);
                    
                }
              });
            });
            

         }catch(err){
            console.error("error in strategy 2 worker thread ", err)
         }
}
module.exports = {fetchStrategy2}