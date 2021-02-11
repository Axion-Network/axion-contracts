import { axionContracts } from '../constants/axion.contracts';
import { ArrayUtil } from '../libs/array.util';
import { FileUtil } from '../libs/file.util';
import { Web3Util } from '../libs/web3.util';

require('dotenv').config();

const ADDRESSES = require('../../deployed-addresses/v1addresses.json');
const { NATIVESWAP_ADDRESS, TOKEN_ADDRESS } = ADDRESSES;

interface NativeSwapState {
  start: string;
  balanceOf: string; // amount of Axion this contract has
}

export const generateNatievSwapSnapshot = async () => {
  const state = {} as NativeSwapState;

  const nativeSwapContracts = Web3Util.web3s.map(
    (web3) =>
      new web3.eth.Contract(
        axionContracts.NativeSwap.ABI as any,
        NATIVESWAP_ADDRESS
      )
  );

  const mainToken = new (Web3Util.getWeb3() as any).eth.Contract(
    axionContracts.MainToken.ABI as any,
    TOKEN_ADDRESS
  );

  /* State - start */
  state.start = await ArrayUtil.getRandomElement(nativeSwapContracts)
    .methods.start()
    .call();

  /* State - balanceOf */
  state.balanceOf = await mainToken.methods
    .balanceOf(NATIVESWAP_ADDRESS)
    .call();

  // Write snapshot as json
  FileUtil.saveSnapshot('native-swap-snapshot.json', state);
};
