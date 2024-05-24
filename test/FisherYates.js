import {Foundry} from '@adraffy/blocksmith';
import {ethers} from 'ethers';
import assert from 'node:assert/strict';

let foundry = await Foundry.launch({infiniteCallGas: true});

let shuffler = await foundry.deploy({sol: `
	import "@src/FisherYates.sol";
	contract Shuffler {
		function shuffle(uint256[] memory v, bytes32 seed) internal pure returns (uint256[] memory) {
			uint256 ptr;
			assembly { ptr := add(v, 32) }
			FisherYates.shuffle(ptr, v.length, v.length, seed);
			return v;
		}
		function shuffleMany(uint256[][] memory m, bytes32 seed) external pure returns (uint256[][] memory) {
			for (uint256 i; i < m.length; i++) {
				m[i] = shuffle(m[i], seed ^ bytes32(i));
			}
			return m;
		}
	}
`});

await check(2);
await check(3);
await check(4);
await check(7);

async function check(N, {batch = 1000} = {}) {
	let t0 = performance.now();
	let chunk = Array.from({length: batch}, () => Array.from({length: N}, (_, i) => i));
	let tally = Array.from({length: N}, () => Array.from({length: N}, () => 0));
	for (let i = 0; i < N; i++) {
		for (let v of await shuffler.shuffleMany(chunk, ethers.id(`seed:${i}`))) {
			v.forEach((x, i) => tally[x][i]++);
		}
	}
	assert.equal(1, new Set(tally.map(v => v.reduce((a, x) => a + x, 0))).size, 'row sum');
	assert.equal(1, new Set(tally.map((_, i) => tally.reduce((a, v) => a +  v[i], 0))).size, 'col sum');

	console.log(`[${N}] ${(performance.now() - t0).toFixed(0)}ms`);
	console.log(tally.map(v => v.map(x => x.toString().padStart(6)).join(' ')).join('\n'));
}

await foundry.shutdown();
