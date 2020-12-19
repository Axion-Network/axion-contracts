import { StakingInstance, TokenInstance } from '../../types/truffle-contracts';
const stakingSnapshot = require('../../real-snapshots/staking-snapshot.json');

export async function restoreStakingSnapshot(
  staking: StakingInstance,
  token: TokenInstance
) {
  console.log('restoreStakingSnapshot');
  const {
    balanceOf,
    globalPayin,
    globalPayout,
    nextPayoutCall,
    payouts,
    shareRate,
    sharesTotalSupply,
    startContract,
    _sessionsIds,
  } = stakingSnapshot;

  await token.bulkMint([staking.address], [balanceOf]);
  console.log('axion minted for Staking', staking.address, balanceOf);

  const payoutList = payouts.map((d: any) => d.payout);
  const payoutSharesTotalSupply = payouts.map((d: any) => d.sharesTotalSupply);

  await staking.setOtherVars(
    startContract,
    '1060000000000000000',
    sharesTotalSupply,
    nextPayoutCall,
    globalPayin,
    globalPayout,
    payoutList,
    payoutSharesTotalSupply,
    _sessionsIds
  );

  console.log(
    'setOtherVars',
    JSON.stringify(
      {
        shareRate,
        sharesTotalSupply,
        nextPayoutCall,
        globalPayin,
        globalPayout,
        payouts,
        payoutList,
        payoutSharesTotalSupply,
      },
      null,
      2
    )
  );

  console.log('restoreStakingSnapshot - Done');
  console.log('---------------------------------');
}
