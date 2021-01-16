// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;
/** OpenZeppelin Dependencies Upgradeable */
// import "@openzeppelin/contracts-upgradeable/contracts/proxy/Initializable.sol";
import '@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
/** OpenZepplin non-upgradeable Swap Token (hex3t) */
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
/** Local Interfaces */
import '../Staking.sol';

contract StakingRestorable is Staking {
    // migration functions
    function setOtherVars(
        uint256 _startTime,
        uint256 _shareRate,
        uint256 _sharesTotalSupply,
        uint256 _nextPayoutCall,
        uint256 _globalPayin,
        uint256 _globalPayout,
        uint256[] calldata _payouts,
        uint256[] calldata _sharesTotalSupplyVec,
        uint256 _lastSessionId
    ) external onlyMigrator {
        startContract = _startTime;
        shareRate = _shareRate;
        sharesTotalSupply = _sharesTotalSupply;
        nextPayoutCall = _nextPayoutCall;
        globalPayin = _globalPayin;
        globalPayout = _globalPayout;
        lastSessionId = _lastSessionId;
        lastSessionIdV1 = _lastSessionId;

        for (uint256 i = 0; i < _payouts.length; i++) {
            payouts.push(
                Payout({
                    payout: _payouts[i],
                    sharesTotalSupply: _sharesTotalSupplyVec[i]
                })
            );
        }
    }

    function setSessionsOf(
        address[] calldata _wallets,
        uint256[] calldata _sessionIds
    ) external onlyMigrator {
        for (uint256 idx = 0; idx < _wallets.length; idx = idx.add(1)) {
            sessionsOf[_wallets[idx]].push(_sessionIds[idx]);
        }
    }

    function setBasePeriod(uint256 _basePeriod) external onlyMigrator {
        basePeriod = _basePeriod;
    }

    function setLastSessionId(uint256 _lastSessionId) external onlyMigrator {
        lastSessionId = _lastSessionId;
    }

    function setSharesTotalSupply(uint256 _sharesTotalSupply)
        external
        onlyMigrator
    {
        sharesTotalSupply = _sharesTotalSupply;
    }

    function setTotalStakedAmount(uint256 _totalStakedAmount)
        external
        onlyMigrator
    {
        totalStakedAmount = _totalStakedAmount;
    }

    /**
     * Fix stake
     * */
    function fixShareRateOnStake(address _staker, uint256 _stakeId)
        external
        onlyMigrator
    {
        Session storage session = sessionDataOf[_staker][_stakeId]; // Get Session
        require(
            session.withdrawn == false && session.shares != 0,
            'STAKING: Session has already been withdrawn'
        );
        sharesTotalSupply = sharesTotalSupply.sub(session.shares); // Subtract shares total share supply
        session.shares = _getStakersSharesAmount(
            session.amount,
            session.start,
            session.end
        ); // update shares
        sharesTotalSupply = sharesTotalSupply.add(session.shares); // Add to total share suuply
    }

    /**
     * Fix v1 unstakers
     * Unfortunately due to people not understanding that we were updating to v2, we need to fix some of our users stakes
     * This code will be removed as soon as we fix stakes
     * In order to run this code it will take at minimum 4 devs / core team to accept any stake
     * This function can not be ran by just anyone.
     */
    function fixV1Stake(address _staker, uint256 _sessionId)
        external
        onlyMigrator
    {
        require(_sessionId <= lastSessionIdV1, 'Staking: Invalid sessionId'); // Require that the sessionId we are looking for is > v1Id

        // Ensure that the session does not exist
        Session storage session = sessionDataOf[_staker][_sessionId];
        require(
            session.shares == 0 && session.withdrawn == false,
            'Staking: Stake already fixed and or withdrawn'
        );

        // Find the v1 stake && ensure the stake has not been withdrawn
        (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 shares,
            uint256 firstPayout
        ) = stakingV1.sessionDataOf(_staker, _sessionId);

        require(shares == 0, 'Staking: Stake has not been withdrawn');

        // Get # of staking days
        uint256 stakingDays = (end.sub(start)).div(stepTimestamp);

        stakeInternalCommon(
            _sessionId,
            amount,
            start,
            end < now ? now : end,
            stakingDays,
            firstPayout,
            _staker
        );
    }

    function makePayoutExternal() external {
        makePayout();
    }
}
