# OffchainNext.sol

Automatically randomize CCIP-Read endpoints and conditionally choose to accept a CCIP-Read response without terminating the request.

* [**OffchainNext.sol**](./src/OffchainNext.sol)

### Usage

* Use `lookupOffchain(...)` instead of `revert LookupOffchain(sender, ...)`
* Use `revert TryNext()` during callback to reject "faux" responses and proceed to the next endpoint
* `revert OffchainEOL()` if all endpoints attempted

### Test

1. `foundryup`
1. `npm i`
1. `npm run test`
