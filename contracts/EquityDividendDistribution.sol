// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./InterfaceEquityStructure.sol";

contract EquityDividendDistribution {
    address public owner; // Contract owner
    uint256 public totalShares; // Total number of shares
    uint256 public totalDividend; // Total dividend amount
    uint256 public lastSharesVersion; // The last updated equity version
    InterfaceEquityStructure public equityStructure;

    struct Shareholder {
        uint256 shares; // Number of shares
        uint256 dividendBalance; // Dividend balance
        uint256 totalWithdrawn; // Total withdrawal amount
        bool exists; // Whether the shareholder exists
    }

    mapping(address => Shareholder) public shareholders; // Mapping of shareholder addresses
    address[] public shareholderAddresses;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor(address _equityStructure) {
        owner = msg.sender;
        totalShares = 0;
        totalDividend = 0;
        updateEquityStructure(_equityStructure);
    }

    // Receive Ether
    receive() external payable {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        bool condition = msg.value > totalShares;

        if (condition) {
            // Check equity structure version
            uint256 _version = equityStructure.getEquityVersion();
            if (_version > lastSharesVersion) {
                // Update equity structure
                _refreshEquityStructure();
            }
            _distributeDividend();
        }
    }

    // Update the address of the equity structure contract, can only be called by the contract owner
    function updateEquityStructure(address _equityStructure) public onlyOwner {
        equityStructure = InterfaceEquityStructure(_equityStructure);
        _refreshEquityStructure();
    }

    // Refresh the equity structure
    function _refreshEquityStructure() private {
        (address[] memory _shareholders, uint256[] memory _newShares) = equityStructure.getEquityStructure();
        uint256 _version = equityStructure.getEquityVersion();
        _updateShareholders(_shareholders, _newShares, _version);
    }

    // Private method to add a shareholder to the shareholderAddresses array
    function _addShareholderToList(address _shareholder) private {
        // Check if _shareholder exists in shareholderAddresses and add if not
        bool found = false;
        for (uint256 i = 0; i < shareholderAddresses.length; i++) {
            if (shareholderAddresses[i] == _shareholder) {
                found = true;
                break;
            }
        }
        if (!found) {
            shareholderAddresses.push(_shareholder);
        }
    }

    // Private method to remove a shareholder's address from the shareholderAddresses array
    function _removeShareholderFromList(address _shareholder) private {
        // Check if _shareholder exists in shareholderAddresses and remove if found
        for (uint256 i = 0; i < shareholderAddresses.length; i++) {
            if (shareholderAddresses[i] == _shareholder) {
                delete shareholderAddresses[i];
                break;
            }
        }
    }

    // Update shareholders' equity information, or add new equity information if it doesn't exist
    function _updateShareholders(address[] memory _shareholders, uint256[] memory _newShares, uint256 _lastSharesVersion) private {
        require(_shareholders.length == _newShares.length, "Arrays length mismatch");

        // Save existing shareholder addresses
        address[] memory existingShareholders = shareholderAddresses;

        // Reset the total number of shares
        totalShares = 0;

        // Iterate through existing shareholder addresses and check if each shareholder is in the new equity list
        for (uint256 i = 0; i < existingShareholders.length; i++) {
            address shareholder = existingShareholders[i];
            bool found = false;

            // Search for the shareholder in the new equity list
            for (uint256 j = 0; j < _shareholders.length; j++) {
                if (shareholder == _shareholders[j]) {
                    found = true;
                    // Update the share count
                    shareholders[shareholder].shares = _newShares[j];
                    totalShares += _newShares[j];
                    break;
                }
            }

            // If the shareholder is not in the new equity list, set their shares to zero, indicating they are former shareholders with no shares.
            if (!found) {
                shareholders[shareholder].shares = 0;
                // Remove the shareholder's address from shareholderAddresses
                _removeShareholderFromList(shareholder);
            }
        }

        // Add new shareholders
        for (uint256 i = 0; i < _shareholders.length; i++) {
            address newShareholder = _shareholders[i];
            uint256 newShares = _newShares[i];

            // Check if the shareholder exists
            if (!shareholders[newShareholder].exists) {
                shareholders[newShareholder] = Shareholder(newShares, 0, 0, true);
                // Accumulate totalShares
                totalShares += newShares;
                _addShareholderToList(newShareholder);
            }
        }

        // Update the version number
        lastSharesVersion = _lastSharesVersion;
    }

    // Distribute dividends
    function _distributeDividend() internal {
        // Check the current balance of this contract
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds available to distribute");

        // Get the total amount to distribute for the current equity
        uint256 _dividendAmount = contractBalance - (totalDividend - totalWithdrawnFunds());

        require(_dividendAmount > 0, "Dividend amount must be greater than 0");

        // Accumulate to the total distribution amount
        totalDividend += _dividendAmount;

        // Calculate the dividend payment for each share
        uint256 dividendPaymentEachShare = (_dividendAmount) / totalShares;

        for (uint256 i = 0; i < shareholderAddresses.length; i++) {
            address shareholderAddr = shareholderAddresses[i];
            Shareholder storage shareholder = shareholders[shareholderAddr];
            uint256 dividendPayment = shareholder.shares * dividendPaymentEachShare;
            shareholder.dividendBalance += dividendPayment;
        }
    }

    // Withdraw dividends
    function withdrawDividends(address holder) external {
        Shareholder storage shareholder = shareholders[holder];
        require(shareholder.exists, "Shareholder does not exist");
        require(shareholder.dividendBalance > 0, "No dividends to withdraw");

        uint256 amountToWithdraw = shareholder.dividendBalance;
        shareholder.dividendBalance = 0;
        shareholder.totalWithdrawn += amountToWithdraw;
        payable(holder).transfer(amountToWithdraw);
    }

    // Get a list of all shareholders' addresses
    function getAllShareholders() public view returns (address[] memory) {
        return shareholderAddresses;
    }

    // Get the total withdrawn funds
    function totalWithdrawnFunds() public view returns (uint256) {
        uint256 totalWithdrawn = 0;
        for (uint256 i = 0; i < shareholderAddresses.length; i++) {
            address shareholderAddr = shareholderAddresses[i];
            totalWithdrawn += shareholders[shareholderAddr].totalWithdrawn;
        }
        return totalWithdrawn;
    }
}