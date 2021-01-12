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
}
