const SubBalances = artifacts.require('SubBalances');
const subBalancesSnapshot = require('./snapshots/sub-balances-snapshot.json');
const _ = require('lodash');

contract(
  'SubBalances - Migration',
  ([
    setter,
    foreignSwapAddress,
    weeklyAuction,
    stakingAddress,
    bigPayDayAddress,
    recipient,
    account1,
    account2,
    account3,
    account4,
  ]) => {
    let subBalances;

    beforeEach(async () => {
      subBalances = await SubBalances.new(setter);
    });

    describe('stakeSessions', () => {
      it('should init stakeSessions using snapshot', async () => {
        const sessionIds = [];
        const stakers = [];
        const sharesList = [];
        const startList = [];
        const endList = [];
        const finishTimeList = [];
        const payDayEligibleList = [];

        Object.keys(subBalancesSnapshot.stakeSessions)
          .slice(0, 40)
          .filter((sessionId) =>
            subBalancesSnapshot.stakeSessions[sessionId].payDayEligible.some(
              Boolean
            )
          )
          .forEach((sessionId) => {
            sessionIds.push(sessionId);
            const {
              start,
              end,
              staker,
              payDayEligible,
              finishTime,
              shares,
            } = subBalancesSnapshot.stakeSessions[sessionId];
            stakers.push(staker);
            sharesList.push(shares);
            startList.push(start);
            endList.push(end);
            finishTimeList.push(finishTime);
            payDayEligibleList.push(...payDayEligible);
          });

        const estimatedGas = await subBalances.addStakeSessions.estimateGas(
          sessionIds,
          stakers,
          sharesList,
          startList,
          endList,
          finishTimeList,
          payDayEligibleList
        );
        console.log('estimatedGas', estimatedGas);

        await subBalances.addStakeSessions(
          sessionIds,
          stakers,
          sharesList,
          startList,
          endList,
          finishTimeList,
          payDayEligibleList
        );
      });
    });

    describe('addUserStakings', () => {
      it('should init addUserStakings using snapshot', async () => {
        const addresses = [];
        const sessionIdCountList = [];
        const allSessionIds = [];
        Object.keys(subBalancesSnapshot.userStakings)
          .slice(0, 40)
          .forEach((address) => {
            addresses.push(address);
            const sessionIds = subBalancesSnapshot.userStakings[address];
            sessionIdCountList.push(sessionIds.length);
            allSessionIds.push(...sessionIds);
          });

        const estimatedGas = await subBalances.addUserStakings.estimateGas(
          addresses,
          sessionIdCountList,
          allSessionIds
        );
        console.log('estimatedGas', estimatedGas);
      });
    });
  }
);
