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
    await swapToken.mint(
      '0xcaaD2020967F0f314Fb8A150413F7f9fC26c0f73',
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
