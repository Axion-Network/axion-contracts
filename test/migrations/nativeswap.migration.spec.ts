import { NativeSwapInstance } from '../../types/truffle-contracts';

const initTestSmartContracts = require('../utils/initTestSmartContracts');
const nativeswapSnapshot = require('./mock-native-swap-snapshot.json');

contract('Nativeswap - Migration', ([setter, recipient]) => {
  let nativeswap: NativeSwapInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    nativeswap = contracts.nativeswap;
  });

  describe('setStart', () => {
    it('should set start time correctly', async () => {
      // act
      await nativeswap.setStart(nativeswapSnapshot.start);

      // assert
      expect(await nativeswap.start().then(String)).to.eq(
        nativeswapSnapshot.start
      );
    });
  });
});
