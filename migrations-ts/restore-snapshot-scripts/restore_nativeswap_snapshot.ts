import { NativeSwapInstance } from '../../types/truffle-contracts';
const nativeSwapSnapshot = require('../../real-snapshots/native-swap-snapshot.json');

export async function restoreNativeSwapSnapshot(
  nativeSwap: NativeSwapInstance
) {
  console.log('restoreNativeSwapSnapshot');
  await nativeSwap.setStart(nativeSwapSnapshot.start);
  console.log('setStart', nativeSwapSnapshot.start);
  console.log('restoreNativeSwapSnapshot - Done');
  console.log('---------------------------------');
}
