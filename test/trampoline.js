// ☠️ Failed Idea: Trampoline

import {Foundry} from '@adraffy/blocksmith';
import {serve, EZCCIP} from '@resolverworks/ezccip';
import assert from 'node:assert/strict';

let foundry = await Foundry.launch();
foundry.provider.on('debug', e => console.log(e.action));

let nexter = await foundry.deploy({file: 'OffchainNexter'});

let contract = await foundry.deploy({sol: `
	import '@src/trampoline/IOffchainNext.sol';
	interface Chonk {
		function chonk() external returns (uint256);
		function chonk2() external returns (uint256);
	}
	contract Test {
		IOffchainNexter immutable _nexter;
		string[] _urls;
		constructor(IOffchainNexter nexter) {
			_nexter = nexter;
		}
		function set_urls(string[] memory urls) external {
			_urls = urls;
		}
		function f() external view returns (uint256) {
			_nexter.offchainLookup(address(this), _urls, abi.encodeCall(Chonk.chonk, ()), this.g.selector, '');
		}
		function g() external pure {
		}
	}
`, args: [nexter]});

let ezccip = new EZCCIP();
ezccip.register('chonk() returns (uint256)', () => [1]);
let ccip_ok = await serve(ezccip, {protocol: 'raw', log: false});

await foundry.confirm(contract.set_urls([ccip_ok.endpoint]));

try {
	await contract.f({enableCcipRead: true});
	assert.fail('expected failure');
} catch (err) {
	console.log(err);
	// https://eips.ethereum.org/EIPS/eip-3668#client-lookup-protocol
	// this is disallowed by the spec, as _nexter != contract
}

await foundry.shutdown();
ccip_ok.http.close();
