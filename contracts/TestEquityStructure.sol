// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./InterfaceEquityStructure.sol";

contract TestEquityStructure is InterfaceEquityStructure {
    mapping (uint256 => uint256) public equityVersionList;
    mapping (uint256 => address[]) public payeesList;
    mapping (uint256 => uint256[]) public sharesList;
    address public owner; 

    constructor(uint256 _sid, address[] memory _payees, uint256[] memory _shares_) {
        require(_payees.length == _shares_.length, "Length mismatch between payees and shares");
        owner = msg.sender;
        payeesList[_sid] = _payees;
        sharesList[_sid] = _shares_;
        equityVersionList[_sid] = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function updateEquityStructure(uint256 _sid, address[] memory _payees, uint256[] memory _shares_) external onlyOwner {
        require(_payees.length == _shares_.length, "Length mismatch between payees and shares");
        
        payeesList[_sid] = _payees;
        sharesList[_sid] = _shares_;
        equityVersionList[_sid] += 1;
    }

    function getEquityVersion(uint256 _sid) external view override returns (uint256) {
        return equityVersionList[_sid];
    }

    function getEquityStructure(uint256 _sid) external view override returns (address[] memory, uint256[] memory) {
        return (payeesList[_sid], sharesList[_sid]);
    }
}