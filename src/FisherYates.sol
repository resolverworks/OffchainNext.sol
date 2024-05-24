/// @author raffy.eth
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library FisherYates {

	// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle

	function shuffle(uint256 ptr, uint256 size) internal view {
		shuffle(ptr, size, size, keccak256(abi.encode(blockhash(block.number), gasleft())));
	}

	// assume: ptr is base of array (& + 32)
	function shuffle(uint256 ptr, uint256 n, uint256 size, bytes32 seed) internal pure {
		assembly {
			for { let i := 0 } lt(i, n) {i := add(i, 1)} {
				let a := add(ptr, shl(5, i))
				mstore(0, seed)
				mstore(32, a)
				let b := add(a, shl(5, mod(keccak256(0, 64), sub(size, i))))
				mstore(0, b)
				let temp := mload(a)
				mstore(a, mload(b))
				mstore(b, temp)
			}
		}
	}

}
