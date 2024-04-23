/// @author raffy.eth
// SPDX-License-Identifier: MIT
// version: 0.0.2
pragma solidity ^0.8.23;

abstract contract OffchainNext {

	error OffchainLookup(address from, string[] urls, bytes request, bytes4 callback, bytes carry);
	error OffchainLookupUnanswered();
	error OffchainTryNext();

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
	
	// return true iff error is due to faux response
	function _shouldTryNext(bytes memory data) internal virtual view returns (bool) {
		return bytes4(data) == OffchainTryNext.selector;
	}

	function offchainLookup(string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) internal view {
		(string[] memory rest, string[] memory pair) = _nextPair(urls);
		revert OffchainLookup(address(this), pair, request, this.offchainLookupCallback.selector, abi.encode(rest, request, callback, carry));
	}

	function offchainLookupCallback(bytes calldata response, bytes calldata extra) external view {
		(string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) = abi.decode(extra, (string[], bytes, bytes4, bytes));
		if (response.length != 0) {
			(bool ok, bytes memory v) = address(this).staticcall(abi.encodeWithSelector(callback, response, carry));
			if (ok) {
				assembly { return(add(v, 32), mload(v)) }
			} else if (!_shouldTryNext(v)) {
				assembly { revert(add(v, 32), mload(v)) }
			}
		}
		offchainLookup(urls, request, callback, carry);
	}

}