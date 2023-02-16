;(await import('dotenv')).config('./.env')
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

export async function getAccessors({ clientOptions={}, dbOptions={}, collectionOptions={} }={})
  {

  /** @type {import('mongodb').MongoClientOptions}   */
  let defaultClientOptions = { 
    serverApi: ServerApiVersion.v1,
    writeConcern: {
      j: true,
      w: "majority",
    },
    readConcernLevel: "majority",
    retryWrites: true,
    readPreference: 'primary',
    monitorCommands: true
  }

  let _clientOptions = Object.assign({}, defaultClientOptions, clientOptions)

  const client = new MongoClient(process.env.MONGOSTRING, _clientOptions);
  await client.connect();

  const db = client.db('playground', dbOptions);
  const collection = db.collection('playground', collectionOptions)

  return {
    client,
    db,
    collection
  }
}

export async function stageForUpdate(collection, query, session){
  //Use ObjectID uniqueness to always modify the document (diff on server), this causes mongo to associate the write with the transacation.
  //Making all other transactions after the update: fail or retry.
  //__txnstaged is a convention name.

  let doc = await collection.findOneAndUpdate(
    query, 
    {$set: { __txnstaged: new ObjectId() }}, 
    { session }
  )
  
  if (!doc.ok) throw new Error('Could not stage for update')
  return !!doc.ok
}

export async function abortAllTransactions(sessions){
  for (const session of sessions) {
    if (!session.transaction.isCommitted) await session.abortTransaction()
  }
}

export async function sleep(duration) { 
  console.log('Sleeping for ' + duration/1000 + ' seconds...')
  return await new Promise(r => setTimeout(r, duration)); 
}

export function logTransactionState(session){
  console.log(session.transaction.state)
}
