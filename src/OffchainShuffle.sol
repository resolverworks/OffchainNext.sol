/// @author raffy.eth
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./FisherYates.sol";

abstract contract OffchainShuffle {

	error OffchainLookup(address from, string[] urls, bytes request, bytes4 callback, bytes carry);

	function _shuffled(string[] memory v, uint256 index) internal view returns (string[] memory ret) {
		uint256 n = v.length;
		ret = new string[](n);
		for (uint256 i; i < n; i += 1) ret[i] = v[i];
		uint256 ptr;
		assembly { ptr := add(ret, 32) }
		FisherYates.shuffle(ptr, n, n, keccak256(abi.encode(blockhash(block.number-1), index)));
	}

	struct State {
		uint256 index;
		address sender;
		string[] urls;
		bytes request;
		bytes4 callback;
		bytes carry;
	}

	function offchainLookup(address sender, string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) internal view {
		_offchainLookup(State(0, sender, urls, request, callback, carry));
	}
	function offchainLookup(bytes calldata encodedState) internal view {
		State memory state = abi.decode(encodedState, (State));
		state.index += 1;
		_offchainLookup(state);
	}
	function _offchainLookup(State memory state) internal view {
		revert OffchainLookup(state.sender, _shuffled(state.urls, state.index), state.request, state.callback, abi.encode(state));
	}

	function extractCarry(bytes calldata encodedState) internal pure returns (bytes memory) {
		return abi.decode(encodedState, (State)).carry;
	}

}
