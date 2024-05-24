/// @author raffy.eth
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./IOffchainTrampoline.sol";

contract OffchainTrampoline is IOffchainTrampoline {

	error OffchainLookup(address from, string[] urls, bytes request, bytes4 callback, bytes carry);

	function _nextPair(string[] memory urls) internal view returns (string[] memory rest, string[] memory pair) {
		if (urls.length == 0) revert OffchainLookupUnanswered();
		uint256 index = block.number % urls.length;
		rest = new string[](urls.length - 1);
		for (uint256 i; i < index; i += 1) rest[i] = urls[i];
		for (uint256 i = index + 1; i < urls.length; i += 1) rest[i-1] = urls[i];
		pair = new string[](2);
		pair[0] = urls[index];
		pair[1] = "data:application/json,{\"data\":\"0x\"}";
	}
	
	function offchainLookup(address sender, string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) public view {
		(string[] memory rest, string[] memory pair) = _nextPair(urls);
		revert OffchainLookup(address(this), pair, request, this.offchainLookupCallback.selector, abi.encode(sender, rest, request, callback, carry));
	}

	function offchainLookupCallback(bytes calldata response, bytes calldata extra) external view {
		(address sender, string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) = abi.decode(extra, (address, string[], bytes, bytes4, bytes));
		if (response.length != 0) {
			// call the original callback
			(bool ok, bytes memory v) = sender.staticcall(abi.encodeWithSelector(callback, response, carry));
			if (ok) {
				assembly { return(add(v, 32), mload(v)) }
			}
			// check for standard next() request
			if (v.length != 4 || bytes4(v) != OffchainTryNext.selector) {
				// there was an unknown error, ask the sender if this is fatal
				bytes memory u;
				(ok, u) = sender.staticcall(abi.encodeCall(IOffchainNext.isOffchainLookupRevertFatal, (v)));
				if (ok && uint256(bytes32(u)) == 1) {
					// it was, so revert with the original error
					assembly { revert(add(v, 32), mload(v)) }
				}
			}
		}
		// try the next endpoint
		offchainLookup(sender, urls, request, callback, carry);
	}

}
