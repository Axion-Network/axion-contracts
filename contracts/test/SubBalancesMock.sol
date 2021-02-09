// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import '../interfaces/ISubBalances.sol';

contract SubBalancesMock is ISubBalances {
    uint256 public callIncomeStakerTriggerCalledCount;
    uint256 public callOutcomeStakerTriggerCalledCount;
    uint256 public callOutcomeStakerTriggerV1CalledCount;

    function callIncomeStakerTrigger(
        address staker,
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 shares
    ) external override {
        callIncomeStakerTriggerCalledCount =
            callIncomeStakerTriggerCalledCount +
            1;
        address(staker);
        uint256(sessionId);
        uint256(start);
        uint256(end);
        uint256(shares);
    }

    function callOutcomeStakerTrigger(
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 actualEnd,
        uint256 shares
    ) external override {
        callOutcomeStakerTriggerCalledCount =
            callOutcomeStakerTriggerCalledCount +
            1;
        uint256(sessionId);
        uint256(start);
        uint256(end);
        uint256(actualEnd);
        uint256(shares);
    }

    function callOutcomeStakerTriggerV1(
        address staker,
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 actualEnd,
        uint256 shares
    ) external override {
        callOutcomeStakerTriggerV1CalledCount =
            callOutcomeStakerTriggerV1CalledCount +
            1;
        address(staker);
        uint256(sessionId);
        uint256(start);
        uint256(end);
        uint256(actualEnd);
        uint256(shares);
    }

    function createMaxShareSession(
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 newShares,
        uint256 oldShares
    ) external override {}

    function createMaxShareSessionV1(
        address staker,
        uint256 sessionId,
        uint256 start,
        uint256 end,
        uint256 newShares,
        uint256 oldShares
    ) external override {}
}
