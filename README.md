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

---

## ☠️ Failed Idea: Trampoline

This approach is not allowed by EIP-3668, specifically: [Client Lookup Protocol: Rule #5](https://eips.ethereum.org/EIPS/eip-3668#client-lookup-protocol)

> If the `sender` field does not match the address of the contract that was called, return an error to the caller and stop.

### Setup

* Trampoline Contract: [**OffchainNexter.sol**](./test/trampoline/OffchainNexter.sol)
* Interface: [**OffchainNext.sol**](./test/trampoline/IOffchainNext.sol)
* Test: `node test/trampoline/test.js`

### Usage

* use: `IOffchainNexter($deploy).offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
	* minimal contract code
	* avoids stack issues
* by default, **any** revert during callback will try next endpoint
* (optional) implement `IOffchainNext.isOffchainLookupRevertFatal(bytes)` to allow specific errors to terminate the request session
	* eg. invalid proof vs exclusion proof
* use `revert OffchainTryNext()` to always try next endpoint
* will `revert OffchainLookupUnanswered()` if all endpoints attempted without success

## ☠️ Failed Idea: Shuffle

This approach cannot determine which endpoint failed.

1. `urls = [a, b, c]`
2. `shuffle() = [b, a, c]`
3. `revert OffchainLookup()`
4. callback fires if any endpoint responds
5. if we want to reject it, we don't know which endpoint to dodge

### Setup

* Abstract Contract Base: [**OffchainShuffle.sol**](./test/shuffle/OffchainShuffle.sol)
* Test: `node test/shuffle/test.js`

### Usage

* inherit `OffchainShuffle`
* use `offchainLookup(...)` instead of `revert OffchainLookup(...)` (same arguments)
