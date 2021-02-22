import { Token } from '../../typechain';

const tokenSnapshot = require('../snapshots/main-token-snapshot.json');
import BN from 'bn.js';

export async function airdropTokens(token: Token, airdropper: string) {
  let totalAirDropAmount = new BN(0);
  for (const userAddress of Object.keys(tokenSnapshot.balanceOf)) {
    const value = new BN(tokenSnapshot.balanceOf[userAddress]);
    totalAirDropAmount = totalAirDropAmount.add(value);
  }

  await token.bulkMint([airdropper], [totalAirDropAmount.toString()]);
  console.log(`Minted tokens ${totalAirDropAmount} to ${airdropper} - done`);
  console.log('---------------------------------');
}
