# OffchainNext.sol

Automatically randomize CCIP-Read endpoints and conditionally choose to accept a CCIP-Read response without terminating the request.

* [**OffchainNext.sol**](./src/OffchainNext.sol)

### Usage

* Use `offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
* Use `revert OffchainTryNext()` during callback to reject "faux" responses and proceed to the next endpoint
* Will `revert OffchainLookupUnanswered()` if all endpoints attempted once

### Test

1. `foundryup`
1. `npm i`
1. `npm run test`
