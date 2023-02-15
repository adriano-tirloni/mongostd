import { getAccessors, abortAllTransactions } from "./index.js";

const { client, collection } = await getAccessors()

let startingDoc = await collection.findOneAndUpdate(
  {id: 'transaction_stale_data'}, 
  {$set: {id: 'transaction_stale_data', rand: 123456789}}, 
  { upsert: true, writeConcern: 'majority', returnDocument: 'after' }
)

console.log('starting doc:', startingDoc.value)

let txnOptions = {readConcern: {level: 'local'}, writeConcern: {w: 'majority'}, readPreference: 'primary'}

const sessions = []
try {
  sessions[0] = client.startSession()
  sessions[0].startTransaction(txnOptions);

  let doc_t1 = await collection.findOne({id: 'transaction_stale_data'}, { session: sessions[0]})
  console.log('doc_t1', doc_t1)

  let outsideWrite = await collection.findOneAndUpdate(
    {id: 'transaction_stale_data'}, 
    {$set: {rand: 999999 }}, 
    {session: undefined, returnDocument: 'after'}
  )
  console.log('outsideWrite:', outsideWrite.value)

  let doc_t2 = await collection.findOne({id: 'transaction_stale_data'}, { session: sessions[0]})
  console.log('doc_t2', doc_t2)
  
  console.log(sessions[0].inTransaction())

} catch (error) {
  console.log(error)
} finally {

  abortAllTransactions(sessions)
  client.close()
  process.exit()
}





