import { getAccessors, sleep, abortAllTransactions } from "./index.js";

const { client, collection } = await getAccessors()

await collection.findOneAndUpdate(
  {id: 'transaction_write_conflict'}, 
  {$set: {id: 'transaction_write_conflict', rand: 123456789}}, 
  { upsert: true, writeConcern: 'majority', returnDocument: 'after' }
)

let txnOptions = {readConcern: {level: 'local'}, writeConcern: {w: 'majority'}, readPreference: 'primary'}

const sessions = []
try {
  sessions[0] = client.startSession()
  sessions[0].startTransaction(txnOptions);
  
  sessions[1] = client.startSession()
  sessions[1].startTransaction(txnOptions);
  
  await collection.findOneAndUpdate(
    {id: 'transaction_write_conflict'}, 
    {$set: {rand: 111 }}, 
    {session: sessions[0]}
  )
  
  await sleep(2000)

  await collection.findOneAndUpdate(
    {id: 'transaction_write_conflict'}, 
    {$set: {rand: 222 }}, 
    {session: sessions[1]}
  )
  
} catch (error) {
  console.log(error)
} finally {

  abortAllTransactions(sessions)
  client.close()
  process.exit()
}





