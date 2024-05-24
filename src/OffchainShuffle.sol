/// @author raffy.eth
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./FisherYates.sol";

import "forge-std/console2.sol";

abstract contract OffchainShuffle {

	error OffchainLookup(address from, string[] urls, bytes request, bytes4 callback, bytes carry);

	function _shuffled(string[] memory v) internal view returns (string[] memory ret) {
		uint256 n = v.length;
		ret = new string[](n);
		for (uint256 i; i < n; i += 1) ret[i] = v[i];
		uint256 ptr;
		assembly { ptr := add(ret, 32) }
		FisherYates.shuffle(ptr, n);
		for (uint256 i; i < n; i += 1) {
			console2.log("%s = %s", i, ret[i]);
		}
	}

	function offchainLookup(address sender, string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) internal view {
		revert OffchainLookup(sender, _shuffled(urls), request, callback, carry);
	}

}
