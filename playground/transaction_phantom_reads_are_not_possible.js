import { getAccessors, sleep, abortAllTransactions } from "./index.js";

const { client, collection } = await getAccessors()


//Setup
await collection.deleteMany({id: 'transaction_phantom_read'}, {writeConcern: 'majority' })
let docsToInsert = Array.from({length: 10000}).map(_ => ({id: 'transaction_phantom_read', rand: 5}))
let bulkInsertResponse = await collection.insertMany(docsToInsert, {writeConcern: 'majority' })
console.log('starting docs:', bulkInsertResponse.insertedCount)


//Script
let txnOptions = {readConcern: {level: 'local'}, writeConcern: {w: 'majority'}, readPreference: 'primary'}

const sessions = []
try {
  sessions[0] = client.startSession()
  sessions[0].startTransaction(txnOptions);

  let docs1 = await findDocs(sessions[0])
  console.log(docs1.length)

  await sleep(5000)
  let deleted = await collection.deleteMany({id: 'transaction_phantom_read'})
  console.log('deleteMany:', deleted)
  await sleep(5000)

  let docs2 = await findDocs(sessions[0])
  console.log(docs2.length)

  
} catch (error) {
  console.log(error)
} finally {

  abortAllTransactions(sessions)
  client.close()
  process.exit()
}


async function findDocs(session){
  let cursor = await collection.find(
    {id: 'transaction_phantom_read', rand: {$gte: 1}}, 
    {session: session}
  )

  return cursor.toArray()
}



