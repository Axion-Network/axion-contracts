import dotenv from 'dotenv';
dotenv.config();

import { ethers, network } from 'hardhat';
import { getRestorableDeployedContracts } from './utils/get_restorable_deployed_contracts';
import { TEST_NETWORKS } from '../constants/common';

// FOREIGN SWAP
// I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
// Need to clarify what they are

/**
 * INIT CONTRACTS (After deployment / snapshot restoration)
 **/
const SCRIPT_NAME = 'CUSTOM SETTERS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const {
      DEPLOYER_ADDRESS,
      RECIPIENT_ADDRESS,
      MANAGER_ADDRESS,
      SWAP_TOKEN_ADDRESS,
      UNISWAP_ADDRESS,
      TIME_IN_DAY,
      AUCTION_V1_ADDRESS,
      STAKING_V1_ADDRESS,
      SUB_BALANCES_V1_ADDRESS,
      STAKE_PERIOD,
    } = process.env as any;

    if (!TEST_NETWORKS.includes(networkName)) {
      [
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        MANAGER_ADDRESS,
        SWAP_TOKEN_ADDRESS,
        UNISWAP_ADDRESS,
        TIME_IN_DAY,
        AUCTION_V1_ADDRESS,
        STAKING_V1_ADDRESS,
        SUB_BALANCES_V1_ADDRESS,
        STAKE_PERIOD,
      ].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const { stakingRestorable } = await getRestorableDeployedContracts(
      networkName
    );

    const fixes = [
      '0x2EBd826CD27E4Ce9927DA6f973840325060DaD58',
      '0xEb65b563D3A1cE05C4d793A58719B171ebE58581',
      '0xCbD4946Af66d9451d7AcFAFEE1234F8925747ebb',
      '0xcFB56b3eE67C3FC890EF660A40fbccAFdCA84d6f',
      '0x36C39434dB7987Cae67233D06de9427c4C67E787',
      '0xCdB374646bCF8bfc09F236B5948a43cA4d5FE63E',
      '0x451DAF0bAcCef6c0A021d395ae51312aeB177A87',
      '0xb1c2AF88eD05bF602B6A0c293737Fc3A47Bbc0Cf',
      '0x7EE522912fF10994fEc79cCe26bF779142Abe2Ac',
      '0x405886457FDC5f435916E626ee7208A6ec785279',
      '0x5CDeD3F4deF59239a3176262Bb17b9D1E93Fce18',
      '0x8Da4F82Dc4D03c5421BB2087F858750c650d8571',
      '0xB4155225eBadFcB14370D7C3965da034C8258E6a',
      '0x3f7Fca6df32bD75f709cBca9344be5f1Efa8D7Bb',
      '0xe2924ca92b9dB75E65e93f8eB7990F0C0AF6106e',
      '0x389391BBC9F438d3fB72c0727476c95dF56F9B3a',
      '0x029c092979db38c15474CACE29330DA283c5F585',
      '0x9Adc565b92d7AE6f5e0AFefAd7173D066855AEEC',
      '0xF1213e07f648d1E8E723D1127300BDe5298149a7',
      '0x622742Fe5e87dFAbAe06Ea381113D4A450c0b54b',
      '0x537F79E81b552F762AFD86F8B50084113C9063eE',
      '0x56445B6849a8495C3330d8B84B27dc740B16690F',
      '0x551C5bC382dCBDaD662BCFC667E29589e31db8E3',
      '0xe12D731750E222eC53b001E00d978901B134CFC9',
      '0x41bfaA3b6f5637c5468A3fE614254fb8EF8a7757',
      '0x361472B5784e83fBF779b015f75ea0722741f304',
      '0xd8AaB28bdFA3142504AB606A556f44449500Bfe2',
      '0x7c68E12d007C3f3332BF53596Ef01dBE75EE232a',
      '0x18d0Aff6206D5C6bddb9b422a0f5e13ab36C1FD2',
      '0x02696f8c1B2fAB5AF74037A250f42de8D46d82EC',
      '0x72959075DA754c2fe820fA83A64563A3615c253f',
      '0x39eBAA70d97a83940cA567d91d293E6c2db5d787',
      '0xFDDe699eEC32F47793d1c39c462BdF29348723c6',
      '0x0960278Fe2e691948036a8DC9256f17c81B7f866',
      '0xf7a98C388D089dCcFba8FC0764ED90d701C86E25',
      '0x2d3dbe056F6C3DeEC0Ba2849dCB8C1EFBc55B04e',
      '0x857202Afda9dC6802554AEA1b37E01B9f897f9AA',
    ];

    for (var i = 0; i < fixes.length; i++) {
      const address = fixes[i];
      const r = await stakingRestorable.setTotalSharesOfAccount(address);
      await r.wait();
      console.log('Finish address', address);
    }

    console.log(
      `============================ ${SCRIPT_NAME}: DONE ===============================`
    );
  } catch (e) {
    console.error(
      `============================ ${SCRIPT_NAME}: FAILED ===============================`
    );
    throw e;
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
