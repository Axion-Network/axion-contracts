import { TokenInstance } from '../../types/truffle-contracts';

const initTestSmartContracts = require('../utils/initTestSmartContracts');
const tokenSnapshot = require('./mock-token-snapshot.json');
import _ from 'lodash';
import BN from 'bn.js';

contract('Token - Migration', ([setter, recipient]) => {
  let token: TokenInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    token = contracts.token;
  });

  describe('setNormalVariables', () => {
    it('should set normal variables', async () => {
      // act
      await token.setNormalVariables(tokenSnapshot.swapTokenBalance);

      // assert
      expect(await token.getSwapTokenBalance(1).then(Number)).to.eq(
        tokenSnapshot.swapTokenBalance
      );
    });
  });

  describe('bulkMint', () => {
    it('should mint to many addresses at once', async () => {
      // arrange
      const NUM_ADDRESSES = 40;
      const userAddresses: string[] = [];
      const amounts: string[] = [];
      let totalSupply = new BN(0);

      Object.keys(tokenSnapshot.balanceOf)
        .slice(0, NUM_ADDRESSES)
        .forEach((userAddress) => {
          const amount = tokenSnapshot.balanceOf[userAddress];
          userAddresses.push(userAddress);
          amounts.push(amount);
          totalSupply = totalSupply.add(new BN(amount));
        });

      // act
      await token.bulkMint(userAddresses, amounts);

      // assert
      expect(await token.totalSupply().then(String)).to.eq(
        totalSupply.toString()
      );

      for (const idx of _.range(NUM_ADDRESSES)) {
        expect(await token.balanceOf(userAddresses[idx]).then(String)).to.eq(
          amounts[idx]
        );
      }
    });
  });
});
