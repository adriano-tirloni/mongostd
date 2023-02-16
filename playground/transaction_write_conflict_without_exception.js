import { getAccessors, sleep } from "./index.js";

const { client, collection } = await getAccessors()

let startingDoc = await collection.findOneAndUpdate(
  {id: 'transaction_write_conflict'}, 
  {$set: {id: 'transaction_write_conflict', rand: 123456789, arr: []}}, 
  { upsert: true, writeConcern: 'majority', returnDocument: 'after' }
)
console.log('starting doc:', startingDoc.value)

let txnOptions = {readConcern: {level: 'local'}, writeConcern: {w: 'majority'}, readPreference: 'primary'}

const sessions = []
try {

  sessions[0] = client.startSession()
  sessions[0].withTransaction(async (session) => {
    console.log('transaction 1 executed')
    await collection.findOneAndUpdate(
      {id: 'transaction_write_conflict'}, 
      {$push: {arr: 0 }}, 
      {session: session}
    )

    await sleep(5000)
  }, txnOptions)

  sessions[1] = client.startSession()
  await sessions[1].withTransaction(async (session) => {
    console.log('transaction 2 executed (multiple logs means retrying.)')
    await collection.findOneAndUpdate(
      {id: 'transaction_write_conflict'}, 
      {$push: {arr: 1 }}, 
      {session: session}
    )    
  }, txnOptions)

  
  let doc = await collection.findOne({id: 'transaction_write_conflict'})
  console.log('all transactions executed', doc)

  
} catch (error) {
  console.log(error)
} finally {
  client.close()
  process.exit()
}





