// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface InterfaceEquityStructure {

    function getEquityVersion(uint _sid) external view returns (uint256);

    function getEquityStructure(uint _sid) external view returns (address[] memory payees, uint256[] memory shares_);

}

