// ☠️ Failed Idea: Trampoline

import {Foundry} from '@adraffy/blocksmith';
import {serve, EZCCIP} from '@resolverworks/ezccip';
import assert from 'node:assert/strict';

let foundry = await Foundry.launch();

let nexter = await foundry.deploy({file: 'OffchainNexter'});

let contract = await foundry.deploy({sol: `
	import '@src/IOffchainTrampoline.sol';
	interface Chonk {
		function chonk() external returns (uint256);
	}
	contract Test {
		IOffchainTrampoline immutable _trampoline;
		string[] _urls;
		constructor(IOffchainTrampoline trampoline) {
			_trampoline = trampoline;
		}
		function set_urls(string[] memory urls) external {
			_urls = urls;
		}
		function f() external view returns (uint256) {
			_trampoline.offchainLookup(address(this), _urls, abi.encodeCall(Chonk.chonk, ()), this.g.selector, '');
		}
		function g() external pure {
		}
	}
`, args: [nexter]});

let ezccip = new EZCCIP();
ezccip.register('chonk() returns (uint256)', () => [1]);
let ccip_ok = await serve(ezccip, {protocol: 'raw', log: false});

await foundry.confirm(contract.set_urls([ccip_ok.endpoint]));

foundry.provider.on('debug', e => console.log(e.action));

try {
	await contract.f({enableCcipRead: true});
	assert.fail('expected failure');
} catch (err) {
	console.error(err);
	// https://eips.ethereum.org/EIPS/eip-3668#client-lookup-protocol
	// this is disallowed by the spec, as trampoline != contract
}

foundry.shutdown();
ccip_ok.http.close();
