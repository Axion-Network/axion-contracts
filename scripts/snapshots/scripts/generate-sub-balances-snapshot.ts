import * as _ from 'lodash';

import { axionContracts } from '../constants/axion.contracts';
import { ArrayUtil } from '../libs/array.util';
import { ConfigUtil } from '../libs/config.util';
import { FileUtil } from '../libs/file.util';
import { Web3Util } from '../libs/web3.util';

require('dotenv').config();

const ADDRESSES = require('../../deployed-addresses/v1addresses.json');
const { SUBBALANCES_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface SubBalance {
  totalShares: string;
  totalWithdrawAmount: string;
  payDayTime: string;
  requiredStakePeriod: string;
  minted: boolean;
}

interface SubBalancesState {
  subBalanceList: SubBalance[];
  startTimestamp: string; // timestamp (seconds)
  currentSharesTotalSupply: string;
  balanceOf: string; // amount of Axion this contract has
  PERIODS: number[];
}

export const generateSubBalancesSnapshot = async () => {
  const state = {
    subBalanceList: [] as SubBalance[],
    PERIODS: [] as number[],
  } as SubBalancesState;

  const subBalancesContracts = Web3Util.web3s.map(
    (web3) =>
      new web3.eth.Contract(
        axionContracts.SubBalance.ABI as any,
        SUBBALANCES_ADDRESS
      )
  );

  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods
    .balanceOf(SUBBALANCES_ADDRESS)
    .call();

  /* State - startTimestamp */
  state.startTimestamp = await ArrayUtil.getRandomElement(subBalancesContracts)
    .methods.startTimestamp()
    .call();

  /* State - currentSharesTotalSupply */
  state.currentSharesTotalSupply = await ArrayUtil.getRandomElement(
    subBalancesContracts
  )
    .methods.currentSharesTotalSupply()
    .call();

  /* State - subBalanceList */
  for (const idx of _.range(ConfigUtil.getNumBpdPools())) {
    state.subBalanceList[idx] = await ArrayUtil.getRandomElement(
      subBalancesContracts
    )
      .methods.subBalanceList(idx)
      .call();
    state.PERIODS[idx] = await ArrayUtil.getRandomElement(subBalancesContracts)
      .methods.PERIODS(idx)
      .call();
  }

  // Write snapshot as json
  FileUtil.saveSnapshot('sub-balances-snapshot.json', state);
};
