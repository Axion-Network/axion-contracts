import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { ContractFactory } from '../../libs/ContractFactory';
import { getDeployedContracts } from '../utils/get_deployed_contracts';
import path from 'path';
import fs from 'fs';
import { AxionMineManager } from '../../typechain';

/**
 * Deploys Axion Mine Manager
 * OG-5555-2.5 Contract: NFT 1
 * 0x3F4a14b2A23BD40944d9D316CDda2c74944C2646
 * OG-5555-100 Contract: NFT 2
 * 0x6d49c44F1bf0Bbe926b1dFe3e20109D1e4BdC626
 * AXN-LIQ-REP Contract: NFT 3
 * 0xBd050D8555EE7c8c0cCc343b541E9Ed02EeeEE05

 **/
const SCRIPT_NAME = 'CREATE MINER';

const main = async () => {
  const networkName = network.name;

  const {
    DEPLOYER_ADDRESS,
    UNISWAP_FACTORY,
    OG_5555_25_NFT,
    OG_5555_100_NFT,
    LIQ_REP_NFT,
    MINE_MANAGER1,
    MINE_MANAGER2,
  } = process.env;

  const { token } = await getDeployedContracts(networkName);

  try {
    console.log(
      `============================ ${SCRIPT_NAME} ===============================`
    );

    const mineManager = (await upgrades.deployProxy(
      await ContractFactory.getAxionMineManagerFactory(),
      [
        DEPLOYER_ADDRESS,
        token.address,
        LIQ_REP_NFT,
        OG_5555_25_NFT,
        OG_5555_100_NFT,
        UNISWAP_FACTORY,
      ],
      { unsafeAllowCustomTypes: true, unsafeAllowLinkedLibraries: true }
    )) as AxionMineManager;

    console.log('Mine Manager Initialized', mineManager.address);

    await mineManager.setupRole(
      await mineManager.MANAGER_ROLE(),
      MINE_MANAGER1 as string
    );

    console.log('Manager roles added');

    const addressFilePath = path.join(
      __dirname,
      '../../',
      'deployed-addresses',
      'mineaddress.json'
    );

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          MINE_MANAGER: mineManager.address,
        },
        null,
        2
      )
    );
    console.log('Contracts addresses saved to', addressFilePath.toString());

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
