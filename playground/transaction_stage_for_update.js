import { MongoErrorLabel } from "mongodb";
import { getAccessors, abortAllTransactions, stageForUpdate, sleep } from "./index.js";

const { client, collection } = await getAccessors()

let startingDoc = await collection.findOneAndUpdate(
  {id: 'transaction_stage_for_update'}, 
  {$set: {id: 'transaction_stage_for_update', rand: 123456789}}, 
  { upsert: true, writeConcern: 'majority', returnDocument: 'after' }
)

console.log('starting doc:', startingDoc.value)

let txnOptions = {readConcern: {level: 'local'}, writeConcern: {w: 'majority'}, readPreference: 'primary'}

const sessions = []
try {
  sessions[0] = client.startSession()
  sessions[0].startTransaction(txnOptions);

  sessions[0].transaction.isCommitted

  let doc_t0 = await stageForUpdate(collection, {id: 'transaction_stage_for_update'}, sessions[0])

  let doc_t1 = await collection.findOne({id: 'transaction_stage_for_update'}, { session: sessions[0]})
  console.log('doc_t1', doc_t1)
  
  setTimeout(async () => {
    let outsideWrite = await collection.findOneAndUpdate(
      {id: 'transaction_stage_for_update'}, 
      {$set: {rand: 999999 }}, 
      {session: undefined, returnDocument: 'after'}
    )
    console.log('outsideWrite:', outsideWrite.value)
  }, 5000);

  await sleep(15000)

  let doc_t2 = await collection.findOne({id: 'transaction_stage_for_update'}, { session: sessions[0]})
  console.log('doc_t2', doc_t2)

  

} catch (error) {
  console.log(error)
} finally {

  abortAllTransactions(sessions)
  client.close()
  process.exit()
}







