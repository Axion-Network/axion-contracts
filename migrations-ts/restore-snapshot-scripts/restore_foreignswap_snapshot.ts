import { ForeignSwapInstance } from '../../types/truffle-contracts';
const foreignSwapSnapshot = require('../../real-snapshots/foreign-swap-snapshot.json');

export async function restoreForeignSwapSnapshot(
  foreignSwap: ForeignSwapInstance
) {
  console.log('restoreForeignSwapSnapshot');
  const { start, claimedAmount, claimedAddresses } = foreignSwapSnapshot;

  await foreignSwap.setStateVariables(claimedAmount, claimedAddresses, start);
  console.log('setStateVariables', claimedAmount, claimedAddresses, start);

  console.log('restoreForeignSwapSnapshot - done');
  console.log('---------------------------------');
}
