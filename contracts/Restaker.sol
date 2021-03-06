// SPDX-License-Identifier: MIT

pragma solidity >=0.4.25 <0.7.0;

import '@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import './interfaces/IToken.sol';
import './interfaces/IStaking.sol';
import './interfaces/IStakingV1.sol';

contract Restaking is Initializable {
    using SafeMathUpgradeable for uint256;

    IStaking internal stakingContract;

    function initialize(address _manager, address _migrator, address _staking)
        public
        initializer
    {
        _setupRole(MANAGER_ROLE, _manager);
        _setupRole(MIGRATOR_ROLE, _migrator);

        stakingContract = IStaking(_staking);
    }

    function restake(
        uint256 sessionId,
        uint256 stakingDays,
        uint256 topup
    ) external pausable {
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares != 0 && session.withdrawn == false,
            'Staking: Stake withdrawn/invalid'
        );

        uint256 actualEnd = now;

        require(session.end <= actualEnd, 'Staking: Stake not mature');

        uint256 amountOut = unstakeInternal(session, sessionId, actualEnd);

        if (topup != 0) {
            IToken(addresses.mainToken).burn(msg.sender, topup);
            amountOut = amountOut.add(topup);
        }

        stakeInternal(amountOut, stakingDays, msg.sender);
    }

    function restakeV1(
        uint256 sessionId,
        uint256 stakingDays,
        uint256 topup
    ) external pausable {
        require(sessionId <= stakingContract.lastSessionIdV1(), 'Staking: Invalid sessionId');
        require(stakingDays != 0, 'Staking: Staking days < 1');
        require(stakingDays <= 5555, 'Staking: Staking days > 5555');

        Session storage session = sessionDataOf[msg.sender][sessionId];

        require(
            session.shares == 0 && session.withdrawn == false,
            'Staking: Stake withdrawn'
        );

        (
            uint256 amount,
            uint256 start,
            uint256 end,
            uint256 shares,
            uint256 firstPayout
        ) = stakingV1.sessionDataOf(msg.sender, sessionId);

        require(shares != 0, 'Staking: Stake withdrawn/doesnt exist');

        uint256 actualEnd = now;

        require(end <= actualEnd, 'Staking: Stake not mature');

        uint256 sessionStakingDays = (end - start) / stepTimestamp;
        uint256 lastPayout = sessionStakingDays + firstPayout;

        uint256 amountOut =
            unstakeV1Internal(
                sessionId,
                amount,
                start,
                end,
                actualEnd,
                shares,
                firstPayout,
                lastPayout,
                sessionStakingDays
            );

        if (topup != 0) {
            IToken(addresses.mainToken).burn(msg.sender, topup);
            amountOut = amountOut.add(topup);
        }

        stakeInternal(amountOut, stakingDays, msg.sender);
    }
}
