import {Foundry} from '@adraffy/blocksmith';
import {serve, EZCCIP} from '@resolverworks/ezccip';
import assert from 'node:assert/strict';

const EXPECT = 69420n;

let foundry = await Foundry.launch();

let contract = await foundry.deploy({sol: `
	import {OffchainNext} from '@src/OffchainNext.sol';
	interface Chonk {
		function chonk() external returns (uint256);
	}
	contract Test is OffchainNext {
		function f(string[] calldata urls) external view returns (uint256) {
			lookupOffchain(urls, abi.encodeCall(Chonk.chonk, ()), this.fCallback.selector, '');
		}
		function fCallback(bytes calldata response, bytes calldata) external view returns (uint256 answer) {
			answer = uint256(bytes32(response));
			if (answer != ${EXPECT}) revert OffchainNext();
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

const stack = [];
foundry.provider.on('debug', x => {
	if (x.action === 'sendCcipReadFetchRequest') {
		let i = URLS.indexOf(x.urls[x.index]);
		stack.push(i < 0 ? '@' : i);
	}
});

for (let urls of permutations(URLS)) {
	foundry.provider.send('anvil_mine', ['0x1']);
	stack.length = 0;
	assert.equal(await contract.f(urls, {enableCcipRead: true}), EXPECT);
	console.log(stack.length, stack.join(''));
}

foundry.shutdown();
ccip_ok.http.close();
ccip_err.http.close();
ccip_wrong.http.close();
ccip_signed.http.close();

// https://github.com/adraffy/ens-normalize.js/blob/9c0e17690d1d2a3d2f5f415814b4bd627d6f1d66/derive/utils.js#L46
function* permutations(v) {
	let n = v.length;
	if (!n) return;
	v = v.slice();
	yield v;
	if (n == 1) return;
	let u = Array(n).fill(0);
	let i = 1;
	while (i < n) {
		if (u[i] < i) {
			let swap = i&1 ? u[i] : 0;
			let temp = v[swap];
			v[swap] = v[i];
			v[i] = temp;
			yield v.slice();
			u[i]++;
			i = 1;
		} else {
			u[i] = 0;
			i++;
		}
	}
}
