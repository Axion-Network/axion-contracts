import dotenv from 'dotenv';
dotenv.config();
import { ContractFactory } from '../libs/ContractFactory';
import { network } from 'hardhat';
/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'MINT TOKENS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { SWAP_TOKEN_ADDRESS } = process.env as any;

    const swapToken = await ContractFactory.getTERC20At(SWAP_TOKEN_ADDRESS);

    // await swapToken.mint(
    //   '0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73',
    //   '1000000000000000000000000000'
    // );

    // await swapToken.mint(
    //   '0xcFB56b3eE67C3FC890EF660A40fbccAFdCA84d6f',
    //   '1000000000000000000000000000'
    // );

    // await swapToken.mint(
    //   '0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD',
    //   '1000000000000000000000000000'
    // );

    await swapToken.mint(
      '0xaA48BA08769f938291D66A2fC8Efeb369163887E',
      '1000000000000000000000000000'
    );

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
