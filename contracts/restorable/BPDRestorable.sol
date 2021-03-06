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
import '../BPD.sol';

contract BPDRestorable is BPD {
    /* Setter methods for contract migration */
    function restoreState(
        bool[5] calldata _poolTransferred,
        uint256[5] calldata _poolYearAmounts
    ) external onlyMigrator {
        poolTransferred = _poolTransferred;
        poolYearAmounts = _poolYearAmounts;
    }
}
