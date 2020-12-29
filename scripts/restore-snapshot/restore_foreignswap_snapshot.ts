import { ForeignSwap } from '../../typechain';

const foreignSwapSnapshot = require('../../real-snapshots/foreign-swap-snapshot.json');

export async function restoreForeignSwapSnapshot(foreignSwap: ForeignSwap) {
  console.log('restoreForeignSwapSnapshot');
  const { start, claimedAmount, claimedAddresses } = foreignSwapSnapshot;

  await foreignSwap.setStateVariables(claimedAmount, claimedAddresses, start);
  console.log('setStateVariables', claimedAmount, claimedAddresses, start);

  console.log('restoreForeignSwapSnapshot - done');
  console.log('---------------------------------');
}
