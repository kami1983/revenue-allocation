// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


contract BoxV2 is Initializable {
    uint256 private box_value;
    uint256 private box_value2;
 
    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);
 
    // Stores a new value in the contract
    function store(uint256 newValue) public initializer{
        box_value = newValue;
        emit ValueChanged(newValue);
    }
    
    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return box_value;
    }

    function getBoxValue2() public view returns (uint256) {
        return box_value2;
    }
    
    // Increments the stored value by 1
    function increment() public {
        box_value = box_value + 1;
        emit ValueChanged(box_value);
    }


}
