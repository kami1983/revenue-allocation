// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import openzeppelin erc20 contract

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Test1155NFT is ERC1155 {
    constructor() ERC1155("https://game.example/api/item/{id}.json") {
        _mint(msg.sender, 0, 100, "");
    }
}