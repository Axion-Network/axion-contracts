import * as _ from 'lodash';

import { axionContracts } from '../constants/axion.contracts';
import { ConfigUtil } from '../libs/config.util';
import { FileUtil } from '../libs/file.util';
import { PromiseUtil } from '../libs/promise.util';
import { Web3Util } from '../libs/web3.util';
import { ContractEvent } from '../libs/contract-event';

const ADDRESSES = require('../../deployed-addresses/v1addresses.json');
const { STAKING_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface Payout {
  payout: string;
  sharesTotalSupply: string;
}

interface StakingState {
  shareRate: string;
  sharesTotalSupply: string;
  nextPayoutCall: string;
  startContract: string;
  globalPayout: string;
  globalPayin: string;
  balanceOf: string; // amount of Axion this contract has
  payouts: Payout[];
  _sessionsIds: string;
}

export const generateStakingSnapshot = async () => {
  const state = {
    payouts: [] as Payout[],
  } as StakingState;

  const stakingContract = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.Staking.ABI as any,
    STAKING_ADDRESS
  );
  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  /* State - shareRate */
  state.shareRate = await stakingContract.methods.shareRate().call();

  /* State - sharesTotalSupply */
  state.sharesTotalSupply = await stakingContract.methods
    .sharesTotalSupply()
    .call();

  /* State - nextPayoutCall */
  state.nextPayoutCall = await stakingContract.methods.nextPayoutCall().call();

  /* State - startContract */
  state.startContract = await stakingContract.methods.startContract().call();

  /* State - globalPayout */
  state.globalPayout = await stakingContract.methods.globalPayout().call();

  /* State - globalPayin */
  state.globalPayin = await stakingContract.methods.globalPayin().call();

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods.balanceOf(STAKING_ADDRESS).call();

  /* State - payouts */
  const promiseFns3 = _.range(0, ConfigUtil.getNumDays()).map(
    (idx) => async () => {
      state.payouts.push(
        await stakingContract.methods
          .payouts(idx)
          .call()
          .catch(() => console.log('payout not found: this is expected'))
      );
    }
  );
  await PromiseUtil.batchPromises(promiseFns3, 7, 'payouts');
  state.payouts = state.payouts.filter(Boolean);

  // get all stake events to get lastSessionId
  const allStakeEvents = await ContractEvent.getPastEventsUsingBlockNumber(
    [stakingContract],
    'Stake',
    100,
    false
  );

  const sessionIds = allStakeEvents.map((event) =>
    Number(event.returnValues.sessionId)
  );
  const lastSessionId = _.last(
    [...sessionIds].sort((num1, num2) => num1 - num2)
  );

  /* State - _sessionsIds */
  state._sessionsIds = String(lastSessionId);

  // Write snapshot as json
  FileUtil.saveSnapshot('staking-snapshot.json', state);
};
