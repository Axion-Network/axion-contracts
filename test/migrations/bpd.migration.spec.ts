import { BPDInstance } from '../../types/truffle-contracts';

const initTestSmartContracts = require('../utils/initTestSmartContracts');
const bpdSnapshot = require('./mock-bpd-snapshot.json');
import _ from 'lodash';

contract('BPD - Migration', ([setter, recipient]) => {
  let bpd: BPDInstance;

  beforeEach(async () => {
    const contracts = await initTestSmartContracts({ setter, recipient });
    bpd = contracts.bpd;
  });

  describe('restoreState', () => {
    it('should restore state', async () => {
      // act
      await bpd.restoreState(
        bpdSnapshot.poolTransferred,
        bpdSnapshot.poolYearAmounts
      );

      // assert
      for (const idx of _.range(5)) {
        expect(await bpd.poolTransferred(idx)).to.eq(
          bpdSnapshot.poolTransferred[idx]
        );
        expect(await bpd.poolYearAmounts(idx).then(String)).to.eq(
          bpdSnapshot.poolYearAmounts[idx]
        );
      }
    });
  });
});
