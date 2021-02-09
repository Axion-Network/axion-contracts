import { Staking, Token } from '../../typechain';

const stakingSnapshot = require('../../snapshots/staking-snapshot.json');

export async function restoreStakingSnapshot(staking: Staking, token: Token) {
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
        _sessionsIds,
      },
      null,
      2
    )
  );

  await staking.setOtherVars(
    startContract,
    '1090000000000000000',
    sharesTotalSupply,
    nextPayoutCall,
    globalPayin,
    globalPayout,
    payoutList,
    payoutSharesTotalSupply,
    _sessionsIds
  );
  // TODO: Update StakingV1 Contract to keep track of total staked amount
  await staking.setTotalStakedAmount('35044444000000000000000000');

  console.log('restoreStakingSnapshot - Done');
  console.log('---------------------------------');
}
