import { StakingInstance } from '../../types/truffle-contracts';
const initTestSmartContracts = require('../utils/initTestSmartContracts');
const stakingSnapshotRest = require('./staking_data_rest.json');
const stakingSnapshot = require('./staking_data.json');


import _ from 'lodash';

function getSessionIDVec(address: String, addressVec: String[], sessionIDVec: number[]) {
  let outVec = [];
  for(let i=0; i<addressVec.length; i++) {
    if(addressVec[i] == address) {
      outVec.push(sessionIDVec[i]);
    }

  }
  return outVec;
}

function getAsString(value: any) {
  return web3.utils.toWei(value.toString());
}

contract('Staking - Migration', ([setter, recipient]) => {
  let staking: StakingInstance;

  beforeEach(async () => {


    /** Since we need to mint token, we'll use a seperate token address */
    const contracts = await initTestSmartContracts({
      setter, recipient

    });
    staking = contracts.staking;
    });

  describe('migration of staking setter', () => {
    it('should init all normal variables', async () => {
      // act
      const payouts_exp = stakingSnapshotRest.payouts.map((x: any) => String(x));
      const sharesTotalSupplyVec_exp = stakingSnapshotRest.sharesSupply.map((x: any) => String(x));

      await staking.setOtherVars(stakingSnapshotRest.shareRate, stakingSnapshotRest.sharesTotalSupply, stakingSnapshotRest.nextPayoutCall,
          stakingSnapshotRest.globalPayin, stakingSnapshotRest.globalPayout, stakingSnapshotRest.payouts, stakingSnapshotRest.sharesSupply, stakingSnapshot.maxSessionID);

      // assert
      expect(String(await staking.shareRate())).to.equal(stakingSnapshotRest.shareRate);
      expect(String(await staking.sharesTotalSupply())).to.equal(stakingSnapshotRest.sharesTotalSupply);
      expect(String(await staking.nextPayoutCall())).to.equal(stakingSnapshotRest.nextPayoutCall);
      expect(String(await staking.globalPayin())).to.equal(stakingSnapshotRest.globalPayin);
      expect(String(await staking.globalPayout())).to.equal(stakingSnapshotRest.globalPayout);
      expect(await staking._sessionsIds().then(String)).to.eq(String(stakingSnapshot.maxSessionID))

      for (const day of _.range(stakingSnapshotRest.payouts.length)) {
        const {payout, sharesTotalSupply} = await staking.payouts(day) as any;
        expect(String(payout)).to.equal(stakingSnapshotRest.payouts[day]);
        expect(String(sharesTotalSupply)).to.equal(stakingSnapshotRest.sharesSupply[day]);
      }
    });
    it('set sessionID single', async () => {
      // act
      let sessionID = new Map();
      let gas = 0;
      for (let idx = 0; idx < stakingSnapshot.address.length; idx++) {
        const address = stakingSnapshot.address[idx];
        if (!sessionID.has(address)) {
          sessionID.set(address, []);
        }
        sessionID.get(address).push(stakingSnapshot.sessionID[idx]);
        await staking.setSessionID(stakingSnapshot.address[idx], stakingSnapshot.sessionID[idx]);
        const gas_inst = await staking.setSessionID.estimateGas(stakingSnapshot.address[idx], stakingSnapshot.sessionID[idx]);
        gas += gas_inst;
      }
      console.log('sessionID single gas=' + gas);
      // assert
      for(const address of sessionID.keys()) {
        const sessionIDVec: any[] = sessionID.get(address);
        for(const id of _.range(sessionIDVec.length)) {
          const ID = await staking.sessionsOf(address, id) as any;
          expect(String(ID)).to.equal(String(sessionIDVec[id]));
        }

      }

    });
    it('set sessionsDataOf single', async () => {
      // act
      let sessionDataOf = new Map();
      let gas = 0;
      for(let idx=0; idx<stakingSnapshot.address.length; idx++) {
        const address = stakingSnapshot.address[idx];
        if (!sessionDataOf.has(address)) {
          sessionDataOf.set(address, new Map());
          sessionDataOf.get(address).set("sessionID", []);
          sessionDataOf.get(address).set("amount", []);
          sessionDataOf.get(address).set("shares", []);
          sessionDataOf.get(address).set("start", []);
          sessionDataOf.get(address).set("stop", []);
          sessionDataOf.get(address).set("nextPayout", []);
        }
        sessionDataOf.get(address).get("sessionID").push(stakingSnapshot.sessionID[idx]);
        sessionDataOf.get(address).get("amount").push(getAsString(stakingSnapshot.amount[idx]));
        sessionDataOf.get(address).get("shares").push(getAsString(stakingSnapshot.shares[idx]));
        sessionDataOf.get(address).get("start").push(stakingSnapshot.starttime[idx]);
        sessionDataOf.get(address).get("stop").push(stakingSnapshot.stoptime[idx]);
        sessionDataOf.get(address).get("nextPayout").push(getAsString(stakingSnapshot.nextPayout[idx]));

        await staking.setSessionDataOf(address, stakingSnapshot.sessionID[idx],
            getAsString(stakingSnapshot.amount[idx]), getAsString(stakingSnapshot.shares[idx]), stakingSnapshot.starttime[idx],
            stakingSnapshot.stoptime[idx], getAsString(stakingSnapshot.nextPayout[idx]));
        const gas_inst = await staking.setSessionDataOf.estimateGas(address, stakingSnapshot.sessionID[idx],
            getAsString(stakingSnapshot.amount[idx]), getAsString(stakingSnapshot.shares[idx]), stakingSnapshot.starttime[idx],
            stakingSnapshot.stoptime[idx], getAsString(stakingSnapshot.nextPayout[idx]));
        gas += gas_inst;
      }
      console.log('sessionsDataOf single gas=' + gas);
      // assert
      for(const address of sessionDataOf.keys()) {
        const sessionIDVec = sessionDataOf.get(address).get("sessionID");
        for (const idx of _.range(sessionIDVec.length)) {
          const {  amount, start, end, shares, nextPayout} = await staking.sessionDataOf(address, sessionIDVec[idx]) as any;

          expect(String(amount)).to.equal(sessionDataOf.get(address).get("amount")[idx]);
          expect(String(start)).to.equal(String(sessionDataOf.get(address).get("start")[idx]));
          expect(String(end)).to.equal(String(sessionDataOf.get(address).get("stop")[idx]));
          expect(String(shares)).to.equal(sessionDataOf.get(address).get("shares")[idx]);
          expect(String(nextPayout)).to.equal(sessionDataOf.get(address).get("nextPayout")[idx]);
          // console.log(String(address) + ' id=' + String(sessionID));
        }
      }

    });
  });
});


