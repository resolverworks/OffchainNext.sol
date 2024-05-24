/// @author raffy.eth
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

error OffchainLookupUnanswered();
error OffchainTryNext();

interface IOffchainNext {
	function isOffchainLookupRevertFatal(bytes calldata error) external view returns (bool);
}

interface IOffchainTrampoline {
	function offchainLookup(address sender, string[] memory urls, bytes memory request, bytes4 callback, bytes memory carry) external view;
}
