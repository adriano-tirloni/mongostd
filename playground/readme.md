# MongoSTD Playground
A series of scripts describing mongodb behaviour.

## transaction_write_conflict_with_error_throw
Expect the second transaction to Error with:
  - `codeName: 'WriteConflict'` 
  - `code: 112` 
  - `[Symbol(errorLabels)]: Set(1) { 'TransientTransactionError' }`.

This happens because with the [core transaction API](https://www.mongodb.com/docs/manual/core/transactions-in-applications/#transaction-error-handling) Mongo Driver won't handle retry logic, leaving that to the developer.

## transaction_stale_data
Expect the transaction to read stale data at doc_t2 (123456789, when it is already 999999). This happens because the transaction creates a snapshot of the data at the momento it begins. Even if readConcern is set to `local` (readSnapshot: Timestamp(0,0)). The transaction is reading most available data at moment of start.