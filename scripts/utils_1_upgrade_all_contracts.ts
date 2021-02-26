import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { getDeployedContracts } from './utils/get_deployed_contracts';
import { ContractFactory } from '../libs/ContractFactory';

/**
 * Upgrade all contracts apart from AuctionManager
 **/
const SCRIPT_NAME = 'UPGRADE 7 CONTRACTS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const {
      auction,
      bpd,
      foreignSwap,
      nativeSwap,
      token,
      subBalances,
      staking,
    } = await getDeployedContracts(networkName);

    // const auctionUpgrade = await upgrades.prepareUpgrade(
    //   auction.address,
    //   await ContractFactory.getAuctionFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded auction contract - ', auctionUpgrade);

    // const bpdUpgrade = await upgrades.prepareUpgrade(
    //   bpd.address,
    //   await ContractFactory.getBPDFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded bpd contract - ', bpdUpgrade);

    // const foreignSwapUpgrade = await upgrades.prepareUpgrade(
    //   foreignSwap.address,
    //   await ContractFactory.getForeignSwapFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded foreignSwap contract - ', foreignSwapUpgrade);

    // const nativeSwapUpgrade = await upgrades.prepareUpgrade(
    //   nativeSwap.address,
    //   await ContractFactory.getNativeSwapFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded nativeSwap contract - ', nativeSwapUpgrade);

    const stakingUpgrade = await upgrades.prepareUpgrade(
      staking.address,
      await ContractFactory.getStakingFactory(),
      {
        unsafeAllowLinkedLibraries: true,
      }
    );
    console.log('Upgraded staking contract - ', stakingUpgrade);

    // const subBalancesUpgrade = await upgrades.prepareUpgrade(
    //   subBalances.address,
    //   await ContractFactory.getSubBalancesFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded subbalances contract - ', subBalancesUpgrade);

    // const tokenUpgrade = await upgrades.prepareUpgrade(
    //   token.address,
    //   await ContractFactory.getTokenFactory(),
    //   {
    //     unsafeAllowLinkedLibraries: true,
    //   }
    // );
    // console.log('Upgraded token contract - ', tokenUpgrade);

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
