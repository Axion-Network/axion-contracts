const bpdSnapshot = require('../../real-snapshots/bpd-snapshot.json');
import { BPDInstance, TokenInstance } from '../../types/truffle-contracts';

export async function restoreBPDSnapshot(
  bpd: BPDInstance,
  token: TokenInstance
) {
  const { poolTransferred, poolYearAmounts, balanceOf } = bpdSnapshot;
  await bpd.restoreState(poolTransferred, poolYearAmounts);
  console.log('restoreState', poolTransferred, poolYearAmounts);

  await token.bulkMint([bpd.address], [balanceOf]);
  console.log('axion minted for BPD', bpd.address, balanceOf);

  console.log('restoreBPDSnapshot - Done');
  console.log('---------------------------------');
}
