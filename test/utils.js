// https://github.com/adraffy/ens-normalize.js/blob/9c0e17690d1d2a3d2f5f415814b4bd627d6f1d66/derive/utils.js#L46
 export function* permutations(v) {
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
