import { NativeSwap } from '../../typechain';

const nativeSwapSnapshot = require('../snapshots/native-swap-snapshot.json');

export async function restoreNativeSwapSnapshot(nativeSwap: NativeSwap) {
  console.log('restoreNativeSwapSnapshot');
  await nativeSwap.setStart(nativeSwapSnapshot.start);
  console.log('setStart', nativeSwapSnapshot.start);
  console.log('restoreNativeSwapSnapshot - Done');
  console.log('---------------------------------');
}
