// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import openzeppelin erc20 contract

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor( string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(msg.sender, 10000 * 18**uint256(decimals()));
    }
}