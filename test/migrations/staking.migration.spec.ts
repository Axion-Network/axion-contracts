import { StakingInstance } from '../../types/truffle-contracts';
const initTestSmartContracts = require('../utils/initTestSmartContracts');
const stakingSnapshotRest = require('./staking_data_rest.json');
const stakingSnapshot = require('./staking_data.json');

import _ from 'lodash';

contract('Staking - Migration', ([setter, recipient]) => {
  let staking: StakingInstance;

  beforeEach(async () => {
    /** Since we need to mint token, we'll use a seperate token address */
    const contracts = await initTestSmartContracts({
      setter,
      recipient,
    });
    staking = contracts.staking;
  });

  describe('migration of staking setter', () => {
    it('should init all normal variables', async () => {
      // act
      await staking.setOtherVars(
        Date.now(),
        stakingSnapshotRest.shareRate,
        stakingSnapshotRest.sharesTotalSupply,
        stakingSnapshotRest.nextPayoutCall,
        stakingSnapshotRest.globalPayin,
        stakingSnapshotRest.globalPayout,
        stakingSnapshotRest.payouts,
        stakingSnapshotRest.sharesSupply,
        stakingSnapshot.maxSessionID
      );

      // assert
      expect(String(await staking.shareRate())).to.equal(
        stakingSnapshotRest.shareRate
      );
      expect(String(await staking.sharesTotalSupply())).to.equal(
        stakingSnapshotRest.sharesTotalSupply
      );
      expect(String(await staking.nextPayoutCall())).to.equal(
        stakingSnapshotRest.nextPayoutCall
      );
      expect(String(await staking.globalPayin())).to.equal(
        stakingSnapshotRest.globalPayin
      );
      expect(String(await staking.globalPayout())).to.equal(
        stakingSnapshotRest.globalPayout
      );
      expect(await staking.lastSessionId().then(String)).to.eq(
        String(stakingSnapshot.maxSessionID)
      );

      for (const day of _.range(stakingSnapshotRest.payouts.length)) {
        const { payout, sharesTotalSupply } = (await staking.payouts(
          day
        )) as any;
        expect(String(payout)).to.equal(stakingSnapshotRest.payouts[day]);
        expect(String(sharesTotalSupply)).to.equal(
          stakingSnapshotRest.sharesSupply[day]
        );
      }
    });
    it('set sessionID single', async () => {
      // act
      let sessionID = new Map();
      let gas = 0;
      for (
        let idx = 0;
        idx < stakingSnapshot.address.slice(0, 20).length;
        idx++
      ) {
        const address = stakingSnapshot.address[idx];
        if (!sessionID.has(address)) {
          sessionID.set(address, []);
        }
        sessionID.get(address).push(stakingSnapshot.sessionID[idx]);
      }
      await staking.setSessionsOf(
        stakingSnapshot.address.slice(0, 20),
        stakingSnapshot.sessionID.slice(0, 20)
      );
      const gas_inst = await staking.setSessionsOf.estimateGas(
        stakingSnapshot.address.slice(0, 20),
        stakingSnapshot.sessionID.slice(0, 20)
      );
      gas += gas_inst;

      console.log('sessionID single gas=' + gas);
      // assert
      for (const address of sessionID.keys()) {
        const sessionIDVec: any[] = sessionID.get(address);
        for (const id of _.range(sessionIDVec.length)) {
          const ID = (await staking.sessionsOf(address, id)) as any;
          expect(String(ID)).to.equal(String(sessionIDVec[id]));
        }
      }
    });
    xit('set sessionsDataOf single', async () => {
      // act
      // Test is no longer necessary
      let sessionDataOf = new Map();
      let gas = 0;

      console.log('sessionsDataOf single gas=' + gas);
    });
  });
});
