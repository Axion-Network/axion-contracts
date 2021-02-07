import dotenv from 'dotenv';
dotenv.config();
import { ContractFactory } from '../libs/ContractFactory';
import { network } from 'hardhat';
/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'DEPLOY AXION LAYER 1 CONTRACTS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );
    console.log(`Running on network: ${networkName}`);

    const { SWAP_TOKEN_ADDRESS } = process.env as any;

    const swapToken = await ContractFactory.getTERC20At(SWAP_TOKEN_ADDRESS);
    await swapToken.mint(
      '0xbE42d298d31b2551aE9E6e88B838A3ba5Dc1D6CD',
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
