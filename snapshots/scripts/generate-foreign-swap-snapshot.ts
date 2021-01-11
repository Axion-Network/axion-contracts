import { axionContracts } from '../constants/axion.contracts';
import { ArrayUtil } from '../libs/array.util';
import { FileUtil } from '../libs/file.util';
import { Web3Util } from '../libs/web3.util';
import { ContractEvent } from '../libs/contract-event';
import { PromiseUtil } from '../libs/promise.util';

require('dotenv').config();

const ADDRESSES = require('../../deployed-addresses/v1addresses.json');
const { FOREIGNSWAP_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface ForeignSwapState {
  claimedAmount: string;
  claimedAddresses: string;
  start: string;
  balanceOf: string; // amount of Axion this contract has
}

export const generateForeignSwapSnapshot = async () => {
  const state = {} as ForeignSwapState;

  const foreignSwapContracts = Web3Util.web3s.map(
    (web3) =>
      new web3.eth.Contract(
        axionContracts.ForeignSwap.ABI as any,
        FOREIGNSWAP_ADDRESS
      )
  );

  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  /* State - claimedAmount */
  state.claimedAmount = await ArrayUtil.getRandomElement(foreignSwapContracts)
    .methods.getCurrentClaimedAmount()
    .call();

  /* State - claimedAddresses */
  state.claimedAddresses = await ArrayUtil.getRandomElement(
    foreignSwapContracts
  )
    .methods.getCurrentClaimedAddresses()
    .call();

  /* State - start */
  state.start = await ArrayUtil.getRandomElement(foreignSwapContracts)
    .methods.start()
    .call();

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods
    .balanceOf(FOREIGNSWAP_ADDRESS)
    .call();

  /* State - claimedBalanceOf */
  const claimedBalanceOf: { [address: string]: string } = {};

  const tokensClaimedEvents = await ContractEvent.getPastEventsUsingBlockNumber(
    foreignSwapContracts as any,
    'TokensClaimed',
    100,
    false
  );
  const allAddresses: string[] = tokensClaimedEvents.map(
    (event) => event.returnValues.account
  );

  const promiseFn = allAddresses.map((address) => async () => {
    claimedBalanceOf[address] = await ArrayUtil.getRandomElement(
      foreignSwapContracts
    )
      .methods.claimedBalanceOf(address)
      .call();
  });

  await PromiseUtil.batchPromises(promiseFn, 100, 'claimedBalanceOf');

  // Write snapshot as json
  FileUtil.saveSnapshot('claimed-balance-of.json', claimedBalanceOf);

  // Write snapshot as json
  FileUtil.saveSnapshot('foreign-swap-snapshot.json', state);
};
