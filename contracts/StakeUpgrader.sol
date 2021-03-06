// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

import '@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import './interfaces/IToken.sol';
import './interfaces/IStaking.sol';
import './interfaces/IStakingV1.sol';

contract Restaking is Initializable {
    using SafeMathUpgradeable for uint256;

    event MaxShareUpgrade(
        address indexed account,
        uint256 indexed sessionId,
        uint256 amount,
        uint256 newAmount,
        uint256 shares,
        uint256 newShares,
        uint256 start,
        uint256 end
    );

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), 'Caller is not a manager');
        _;
    }

    modifier pausable() {
        require(
            paused == false || hasRole(MIGRATOR_ROLE, _msgSender()),
            'Contract is paused'
        );
        _;
    }

    uint16 internal maxShareMaxDays;
    bool internal maxShareEventActive;

    function initialize(address _manager, address _migrator)
        external
        initializer
    {
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(MIGRATOR_ROLE, _migrator);
        init_ = false;
    }

    //function that allows a stake to be upgraded to a stake with a length of 5555 days without incuring any penalties
    //the function takes the current earned interest and uses the principal + interest to create a new stake
    //for v2 stakes it's only updating the current existing stake info, it's not creating a new stake
    // @param sessionId {uint256} - id of the staking session
    function maxShare(uint256 sessionId) external pausable {
        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares != 0 && session.withdrawn == false,
            'STAKING: Stake withdrawn or not set'
        );

        (
            uint256 newStart,
            uint256 newEnd,
            uint256 newAmount,
            uint256 newShares
        ) =
            maxShareUpgrade(
                session.firstPayout,
                session.lastPayout,
                session.shares,
                session.amount
            );

        uint256 stakingDays = (session.end - session.start) / stepTimestamp;
        if (stakingDays >= basePeriod) {
            ISubBalances(addresses.subBalances).createMaxShareSession(
                sessionId,
                newStart,
                newEnd,
                newShares,
                session.shares
            );
        } else {
            ISubBalances(addresses.subBalances).callIncomeStakerTrigger(
                msg.sender,
                sessionId,
                newStart,
                newEnd,
                newShares
            );
        }

        maxShareInternal(
            sessionId,
            session.shares,
            newShares,
            session.amount,
            newAmount,
            newStart,
            newEnd
        );

        sessionDataOf[msg.sender][sessionId].amount = newAmount;
        sessionDataOf[msg.sender][sessionId].end = newEnd;
        sessionDataOf[msg.sender][sessionId].start = newStart;
        sessionDataOf[msg.sender][sessionId].shares = newShares;
        sessionDataOf[msg.sender][sessionId].firstPayout = payouts.length;
        sessionDataOf[msg.sender][sessionId].lastPayout = payouts.length + 5555;
    }

    // similar to the maxShare function, but for layer 1 stakes only
    // @param sessionId {uint256} - id of the staking session
    function maxShareV1(uint256 sessionId) external pausable {
        require(sessionId <= lastSessionIdV1, 'STAKING: Invalid sessionId');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares == 0 && session.withdrawn == false,
            'STAKING: Stake withdrawn'
        );

        (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 shares,
            uint256 firstPayout
        ) = stakingV1.sessionDataOf(msg.sender, sessionId);
        uint256 stakingDays = (end - start) / stepTimestamp;
        uint256 lastPayout = stakingDays + firstPayout;

        (
            uint256 newStart,
            uint256 newEnd,
            uint256 newAmount,
            uint256 newShares
        ) = maxShareUpgrade(firstPayout, lastPayout, shares, amount);

        if (stakingDays >= basePeriod) {
            ISubBalances(addresses.subBalances).createMaxShareSessionV1(
                msg.sender,
                sessionId,
                newStart,
                newEnd,
                newShares, // new shares
                shares // old shares
            );
        } else {
            ISubBalances(addresses.subBalances).callIncomeStakerTrigger(
                msg.sender,
                sessionId,
                newStart,
                newEnd,
                newShares
            );
        }

        maxShareInternal(
            sessionId,
            shares,
            newShares,
            amount,
            newAmount,
            newStart,
            newEnd
        );

        sessionDataOf[msg.sender][sessionId] = Session({
            amount: newAmount,
            start: newStart,
            end: newEnd,
            shares: newShares,
            firstPayout: payouts.length,
            lastPayout: payouts.length + 5555,
            withdrawn: false,
            payout: 0
        });

        sessionsOf[msg.sender].push(sessionId);
    }

    //function to calculate the new start, end, new amount and new shares for a max share upgrade
    // @param firstPayout {uint256} - id of the first Payout
    // @param lasttPayout {uint256} - id of the last Payout
    // @param shares {uint256} - number of shares
    // @param amount {uint256} - amount of AXN
    function maxShareUpgrade(
        uint256 firstPayout,
        uint256 lastPayout,
        uint256 shares,
        uint256 amount
    )
        internal
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        require(
            maxShareEventActive == true,
            'STAKING: Max Share event is not active'
        );
        require(
            lastPayout - firstPayout <= maxShareMaxDays,
            'STAKING: Max Share Upgrade - Stake must be less then max share max days'
        );

        uint256 stakingInterest =
            calculateStakingInterest(firstPayout, lastPayout, shares);

        uint256 newStart = now;
        uint256 newEnd = newStart + (stepTimestamp * 5555);
        uint256 newAmount = stakingInterest + amount;
        uint256 newShares =
            _getStakersSharesAmount(newAmount, newStart, newEnd);

        require(
            newShares > shares,
            'STAKING: New shares are not greater then previous shares'
        );

        return (newStart, newEnd, newAmount, newShares);
    }

    // @param sessionId {uint256} - id of the staking session
    // @param oldShares {uint256} - previous number of shares
    // @param newShares {uint256} - new number of shares
    // @param oldAmount {uint256} - old amount of AXN
    // @param newAmount {uint256} - new amount of AXN
    // @param newStart {uint256} - new start date for the stake
    // @param newEnd {uint256} - new end date for the stake
    function maxShareInternal(
        uint256 sessionId,
        uint256 oldShares,
        uint256 newShares,
        uint256 oldAmount,
        uint256 newAmount,
        uint256 newStart,
        uint256 newEnd
    ) internal {
        if (now >= nextPayoutCall) makePayout();
        if (isVcaRegistered[msg.sender] == false)
            setTotalSharesOfAccountInternal(msg.sender);

        sharesTotalSupply = sharesTotalSupply.add(newShares - oldShares);
        totalStakedAmount = totalStakedAmount.add(newAmount - oldAmount);
        totalVcaRegisteredShares = totalVcaRegisteredShares.add(
            newShares - oldShares
        );

        uint256 oldTotalSharesOf = totalSharesOf[msg.sender];
        totalSharesOf[msg.sender] = totalSharesOf[msg.sender].add(
            newShares - oldShares
        );

        rebalance(msg.sender, oldTotalSharesOf);

        emit MaxShareUpgrade(
            msg.sender,
            sessionId,
            oldAmount,
            newAmount,
            oldShares,
            newShares,
            newStart,
            newEnd
        );
    }

    function setMaxShareEventActive(bool _active) external onlyManager {
        maxShareEventActive = _active;
    }

    function setMaxShareMaxDays(uint16 _maxShareMaxDays) external onlyManager {
        maxShareMaxDays = _maxShareMaxDays;
    }

    function getMaxShareEventActive() external view returns (bool) {
        return maxShareEventActive;
    }

    function getMaxShareMaxDays() external view returns (uint16) {
        return maxShareMaxDays;
    }
}
