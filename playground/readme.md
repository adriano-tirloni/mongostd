# MongoSTD Playground
A series of scripts describing mongodb behaviour.

## transaction_write_conflict_with_exception
Expect the second transaction to Error with:
  - `codeName: 'WriteConflict'` 
  - `code: 112` 
  - `[Symbol(errorLabels)]: Set(1) { 'TransientTransactionError' }`.

This happens because with the [core transaction API](https://www.mongodb.com/docs/manual/core/transactions-in-applications/#transaction-error-handling) Mongo Driver won't handle retry logic, leaving that to the developer.

## transaction_write_conflict_without_exception
It is the same logic implemented by `transaction_write_conflict_with_exception`. But using callback API, which handle TransientTransactionError with retry logic inside node driver.

## transaction_stale_data
Expect the transaction to read stale data at doc_t2 (123456789, when it is already 999999). This happens because the transaction creates a snapshot of the data at the momento it begins. Even if readConcern is set to `local` (readSnapshot: Timestamp(0,0)). The transaction is reading most available data at moment of start.

## transaction_stage_for_update
With retryWrites set to true expect the outside update to wait until the transaction has finished to be executed. In fact it isn't waiting, but erroring and being constantly retried.