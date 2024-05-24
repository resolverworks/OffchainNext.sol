# OffchainNext.sol

Automatically randomize CCIP-Read endpoints and conditionally choose to accept a response without terminating the request session.  Calls will succeed as long as one endpoint produces a valid response.

### Testing Requirements

1. `foundryup`
1. `npm i`

## Setup

* Abstract Contract Base: [**OffchainNext.sol**](./src/OffchainNext.sol)
* Test: `node test/test.js`

### Usage

* inherit `OffchainNext`
* use `offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
* use `revert OffchainTryNext()` during callback to reject responses and proceed to the next endpoint
* will `revert OffchainLookupUnanswered()` if all endpoints attempted without success
* override `_shouldTryNext(bytes)` to control which exceptions should retry

---

## ☠️ Failed Idea: Shuffle

This approach works but cannot determine which endpoint failed so calls may take infinite time.

1. `revert OffchainLookup(shuffled([a, b, c, ...]), ...)`
1. callback fires if any endpoint responds
1. since we don't know which endpoint answered, must retry all endpoints again

### Setup

* Abstract Contract Base: [**OffchainShuffle.sol**](./src/OffchainShuffle.sol)
* Test: [`node test/shuffle.js`](./test/shuffle.js)

### Usage

* inherit `OffchainShuffle`
* use `offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
* on valid response, decode original `carry` using `extractCarry(carry)`
* to reject response, call `offchainLookup(carry)`

## ☠️ Failed Idea: Trampoline

This approach is not allowed by EIP-3668, specifically: [Client Lookup Protocol: Rule #5](https://eips.ethereum.org/EIPS/eip-3668#client-lookup-protocol)

> If the `sender` field does not match the address of the contract that was called, return an error to the caller and stop.

### Setup

* Singleton Contract: [**OffchainTrampoline.sol**](./src/OffchainTrampoline.sol)
* Interface: [IOffchainTrampoline.sol](./src/IOffchainTrampoline.sol)
* Test: [`node test/trampoline.js`](./test/shuffle.js)

### Usage

* deploy `IOffchainTrampoline`
* use: `IOffchainTrampoline().offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
	* minimal contract code
	* avoids stack issues
* by default, **any** revert during callback will try next endpoint
* (optional) implement `IOffchainNext.isOffchainLookupRevertFatal(bytes)` to allow specific errors to terminate the request session
	* eg. invalid proof vs exclusion proof
* use `revert OffchainTryNext()` to always try next endpoint
* will `revert OffchainLookupUnanswered()` if all endpoints attempted without success

## FisherYates.sol

* Library: [**FisherYates.sol**](./src/FisherYates.sol)
* Test: [`node test/FisherYates.js`](./test/FisherYates.js)
