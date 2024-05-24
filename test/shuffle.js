// ☠️ Failed Idea: Shuffle

import {Foundry} from '@adraffy/blocksmith';
import {serve, EZCCIP} from '@resolverworks/ezccip';
import assert from 'node:assert/strict';

const EXPECT = 69420n;

let foundry = await Foundry.launch();

let contract = await foundry.deploy({sol: `
	import '@src/OffchainShuffle.sol';
	interface Chonk {
		function chonk() external returns (uint256);
	}
	contract Test is OffchainShuffle {
		string[] _urls;
		function set_urls(string[] memory urls) external {
			_urls = urls;
		}
		function f() external view returns (uint256) {
			offchainLookup(address(this), _urls, abi.encodeCall(Chonk.chonk, ()), this.g.selector, '');
		}
		function g(bytes calldata response, bytes calldata encodedState) external view returns (uint256 answer) {
			answer = uint256(bytes32(response));
			if (answer != ${EXPECT}) offchainLookup(encodedState);
		}
	}
`});

let ezccip = new EZCCIP();
ezccip.register('chonk() returns (uint256)', () => [EXPECT]);
let ccip_ok = await serve(ezccip, {protocol: 'raw', log: false});
let ccip_signed = await serve(ezccip, {protocol: 'tor', log: false});

let ezccip_wrong = new EZCCIP();
ezccip_wrong.register('chonk() returns (uint256)', () => [EXPECT+1]);
let ccip_wrong = await serve(ezccip_wrong, {protocol: 'raw', log: false});

let ezccip_throw = new EZCCIP();
ezccip_throw.register('chonk() returns (uint256)', () => { throw new Error('wtf'); });
let ccip_err = await serve(ezccip_throw, {protocol: 'raw', log: false});

const URLS = [
	'https://ethereum.org/', // not a ccip server
	ccip_signed.endpoint,    // wrong protocol
	ccip_wrong.endpoint,     // wrong answer
	ccip_err.endpoint,       // throws
	ccip_ok.endpoint         // correct
];

await foundry.confirm(contract.set_urls(URLS), {silent: true});

const stack = [];
foundry.provider.on('debug', x => {
	if (x.action === 'sendCcipReadFetchRequest') {
		stack.push(URLS.indexOf(x.urls[x.index]));
	}
});

for (let i = 0; i < 100; i++) {
	stack.length = 0;
	await foundry.nextBlock(); // rng depends on block
	assert.equal(await contract.f({enableCcipRead: true}), EXPECT);
	console.log(i, stack.length, stack.join(''));
}

foundry.shutdown();
ccip_ok.http.close();
ccip_err.http.close();
ccip_wrong.http.close();
ccip_signed.http.close();
