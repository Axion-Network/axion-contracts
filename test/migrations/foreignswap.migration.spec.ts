import { ForeignSwapInstance } from '../../types/truffle-contracts';

const initTestSmartContracts = require('../utils/initTestSmartContracts');
const foreignSwapSnapshot = require('./mock-foreign-swap-snapshot.json');

contract('Foreign Swap - Migration', ([setter, recipient]) => {
  let foreignSwap: ForeignSwapInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    foreignSwap = contracts.foreignswap;
  });

  describe('setStateVariables', () => {
    it('should set state variables correctly', async () => {
      // arrange
      const { claimedAmount, claimedAddresses, start } = foreignSwapSnapshot;

      // act
      await foreignSwap.setStateVariables(
        claimedAmount,
        claimedAddresses,
        start
      );

      // assert
      expect(await foreignSwap.getCurrentClaimedAmount().then(String)).to.eq(
        claimedAmount
      );
      expect(await foreignSwap.getCurrentClaimedAddresses().then(String)).to.eq(
        claimedAddresses
      );
      expect(await foreignSwap.start().then(String)).to.eq(start);
    });
  });

  describe('setClaimedBalanceOf', () => {
    it('should set claimed balance of correctly', async () => {
      // arrange
      const userAddresses: string[] = [];
      const amounts: string[] = [];
      Object.keys(foreignSwapSnapshot.claimedBalanceOf)
        .slice(0, 20)
        .forEach((userAddress) => {
          userAddresses.push(userAddress);
          amounts.push(foreignSwapSnapshot.claimedBalanceOf[userAddress]);
        });

      // act
      await foreignSwap.setClaimedBalanceOf(userAddresses, amounts);

      // assert
      for (const userAddress of userAddresses) {
        expect(
          await foreignSwap.claimedBalanceOf(userAddress).then(String)
        ).to.eq(foreignSwapSnapshot.claimedBalanceOf[userAddress]);
      }
    });
  });
});
