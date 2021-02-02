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
import '../ForeignSwap.sol';

contract ForeignSwapRestorable is ForeignSwap {
    /* Setter methods for contract migration */
    function setStateVariables(
        uint256 _claimedAmount,
        uint256 _claimedAddresses,
        uint256 _start
    ) external onlyMigrator {
        claimedAmount = _claimedAmount;
        claimedAddresses = _claimedAddresses;
        start = _start;
    }

    function setClaimedBalanceOf(
        address[] calldata userAddresses,
        uint256[] calldata amounts
    ) external onlyMigrator {
        for (uint256 idx = 0; idx < userAddresses.length; idx = idx.add(1)) {
            claimedBalanceOf[userAddresses[idx]] = amounts[idx];
        }
    }
}
