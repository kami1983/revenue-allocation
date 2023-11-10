// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IEcoDividendDistribution.sol";

interface IVersion {
    function impVersion() external pure returns (uint16);
}

