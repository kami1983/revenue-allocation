// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./InterfaceEquityStructure.sol";

contract TestEquityStructure is InterfaceEquityStructure {
    uint256 public equity_version;
    address[] public payees;
    uint256[] public shares_;
    address public owner; 

    constructor(address[] memory _payees, uint256[] memory _shares_) {
        require(_payees.length == _shares_.length, "Length mismatch between payees and shares");
        owner = msg.sender;
        payees = _payees;
        shares_ = _shares_;
        equity_version = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function updateEquityStructure(address[] memory _payees, uint256[] memory _shares_) external onlyOwner {
        require(_payees.length == _shares_.length, "Length mismatch between payees and shares");
        
        payees = _payees;
        shares_ = _shares_;
        equity_version += 1;
    }

    function getEquityVersion() external view override returns (uint256) {
        return equity_version;
    }

    function getEquityStructure() external view override returns (address[] memory, uint256[] memory) {
        return (payees, shares_);
    }
}