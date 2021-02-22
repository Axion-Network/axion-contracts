import * as _ from 'lodash';

import { axionContracts } from '../constants/axion.contracts';
import { ConfigUtil } from '../libs/config.util';
import { FileUtil } from '../libs/file.util';
import { PromiseUtil } from '../libs/promise.util';
import { Web3Util } from '../libs/web3.util';

require('dotenv').config();

const ADDRESSES = require('../../../deployed-addresses/v1addresses.json');
const { BPD_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface BPDState {
  poolYearAmounts: string[];
  poolTransferred: boolean[];
  balanceOf: string; // amount of Axion this contract has
}

export const generateBPDSnapshot = async () => {
  const state = {
    poolYearAmounts: [],
    poolTransferred: [],
    balanceOf: '0',
  } as BPDState;

  const bpdContract = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.BPD.ABI as any,
    BPD_ADDRESS
  );
  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  const poolIndices = _.range(0, ConfigUtil.getNumBpdPools());

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods.balanceOf(BPD_ADDRESS).call();

  const promiseFns = await poolIndices.map((poolIdx) => async () => {
    state.poolYearAmounts[poolIdx] = await bpdContract.methods
      .poolYearAmounts(poolIdx)
      .call();

    state.poolTransferred[poolIdx] = await bpdContract.methods
      .poolTransferred(poolIdx)
      .call();
  });

  await PromiseUtil.batchPromises(
    promiseFns,
    5,
    'poolYearAmounts & poolTransferred'
  );

  // Write snapshot as json
  FileUtil.saveSnapshot('bpd-snapshot.json', state);
};
