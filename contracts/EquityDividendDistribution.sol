// SPDX-License-Identifier: Proprietary
pragma solidity ^0.8.9;

import "./InterfaceEquityStructure.sol";

// import "hardhat/console.sol";


contract EquityDividendDistribution {
    address public owner; // Contract owner
    address public register; // 

    uint256[] public totalShares; // Total number of shares
    uint256[] public totalDividend; // Total dividend amount
    uint256[] public lastSharesVersion; // The last updated equity version

    InterfaceEquityStructure public equityStructure;

    struct Shareholder {
        uint256 shares; // Number of shares
        uint256 dividendBalance; // Dividend balance
        uint256 totalWithdrawn; // Total withdrawal amount
        bool exists; // Whether the shareholder exists
    }

    // Array index is the sid value.
    mapping(address => Shareholder)[] public shareholdersList; // Mapping of shareholder addresses
    mapping(uint256 => address[]) public shareholderAddressesList;

    // A mapping of S-NFT id to local shareholder id
    // uint256 mapNextId = 0;
    mapping(uint256 => uint256) public sidMap;
    mapping(uint256 => address) public balanceAddressList;
    
    // address[] public shareholderAddresses;

    modifier onlyOwner() {
        require(msg.sender == register, "Only the owner can call this function");
        _;
    }

    modifier onlyRegister() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor(address _equityStructure) {
        owner = msg.sender;
        register = msg.sender;
        updateEquityStructure(_equityStructure);
    }

    // update register
    function updateRegister(address _register) public onlyOwner {
        register = _register;
    }

    // transfer owner
    function transferOwner(address _owner) public onlyOwner {
        owner = _owner;
    }

    // Receive Ether
    receive() external payable {
        // Check if the received amount is greater than the total number of shares; otherwise, the funds accumulate for the next distribution.
        bool condition = msg.value > totalShares[0];

        // get msg user
        // address _user = msg.sender;
        (uint256 _sMapKey,) = getSidRelatedInfos(0);

        if (condition) {
            // Check equity structure version
            uint256 _version = equityStructure.getEquityVersion();
            if (_version > lastSharesVersion[0]) {
                // Update equity structure
                _refreshEquityStructure(_sMapKey);
            }

            _distributeDividend(_sMapKey);
        }
    }

    // Register a Shares, will set the sid and sidExists
    function registerSid(uint256 _sid, address _balanceOfAddress) public onlyRegister {
        require(_balanceOfAddress != address(0), "balanceOfAddress is zero");
        // sid already registered
        require(balanceAddressList[_sid] == address(0), "sid already registered");
        balanceAddressList[_sid] = _balanceOfAddress;
        // init data lists
        shareholdersList.push();
        totalShares.push(0);
        totalDividend.push(0); 
        lastSharesVersion.push(0); 

        uint256 mapNextId = shareholdersList.length - 1;

        // Get sidMap length 
        sidMap[_sid] = mapNextId;
        // shareholdersList[mapNextId];
        _refreshEquityStructure(mapNextId);
        mapNextId++;
    }

    function getSidRelatedInfos(uint256 _sid) public view returns (uint256, address) {
        require(balanceAddressList[_sid] != address(0), "sid not registered");
        return (sidMap[_sid], balanceAddressList[_sid]);
    }

    // Update the address of the equity structure contract, can only be called by the contract owner
    function updateEquityStructure(address _equityStructure) public onlyOwner {
        equityStructure = InterfaceEquityStructure(_equityStructure);
        // _refreshEquityStructure();
    }

    // Refresh the equity structure
    function _refreshEquityStructure(uint256 _mid) private {
        (address[] memory _newShareholders, uint256[] memory _newShares) = equityStructure.getEquityStructure();
        uint256 _version = equityStructure.getEquityVersion();
        _updateShareholders(_mid, _newShareholders, _newShares, _version);
    }

    // Private method to add a shareholder to the shareholderAddresses array
    function _addShareholderToList(uint256 _mid, address _shareholder) private {

        
        // Check if _shareholder exists in shareholderAddresses and add if not
        bool found = false;
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            if (shareholderAddressesList[_mid][i] == _shareholder) {
                found = true;
                break;
            }
        }
        if (!found) {
            shareholderAddressesList[_mid].push(_shareholder);
        }
    }

    // Private method to remove a shareholder's address from the shareholderAddresses array
    function _removeShareholderFromList(uint256 _mid, address _shareholder) private {
        // Check if _shareholder exists in shareholderAddresses and remove if found
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            if (shareholderAddressesList[_mid][i] == _shareholder) {
                delete shareholderAddressesList[_mid][i];
                break;
            }
        }
    }

    // Update shareholders' equity information, or add new equity information if it doesn't exist
    function _updateShareholders(uint256 _mid, address[] memory _shareholders, uint256[] memory _newShares, uint256 _lastSharesVersion) private {
        require(_shareholders.length == _newShares.length, "Arrays length mismatch");

        // Save existing shareholder addresses
        address[] memory existingShareholders = shareholderAddressesList[_mid];

        // Reset the total number of shares
        totalShares[_mid] = 0;

        // Iterate through existing shareholder addresses and check if each shareholder is in the new equity list
        for (uint256 i = 0; i < existingShareholders.length; i++) {
            address shareholder = existingShareholders[i];
            bool found = false;

            // Search for the shareholder in the new equity list
            for (uint256 j = 0; j < _shareholders.length; j++) {
                if (shareholder == _shareholders[j]) {
                    found = true;
                    // Update the share count
                    shareholdersList[_mid][shareholder].shares = _newShares[j];
                    totalShares[_mid] += _newShares[j];
                    break;
                }
            }

            // If the shareholder is not in the new equity list, set their shares to zero, indicating they are former shareholders with no shares.
            if (!found) {
                shareholdersList[_mid][shareholder].shares = 0;
                // Remove the shareholder's address from shareholderAddresses
                _removeShareholderFromList(_mid, shareholder);
            }
        }

        // Add new shareholders
        for (uint256 i = 0; i < _shareholders.length; i++) {
            address newShareholder = _shareholders[i];
            uint256 newShares = _newShares[i];

            // Check if the shareholder exists
            // Why shareholdersList.length > _mid ? because shareholdersList[_mid] is a mapping, 
            // it will be created when the first shareholder is added.
            if (!shareholdersList[_mid][newShareholder].exists) {
                shareholdersList[_mid][newShareholder] = Shareholder(newShares, 0, 0, true);
                // Accumulate totalShares
                totalShares[_mid] += newShares;
                _addShareholderToList(_mid, newShareholder);
            }
        }

        // Update the version number
        lastSharesVersion[_mid] = _lastSharesVersion;
    }

    // Distribute dividends
    function _distributeDividend(uint256 _mid) internal {

        // Check the current balance of this contract
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds available to distribute");

        // Get the total amount to distribute for the current equity
        uint256 _dividendAmount = contractBalance - (totalDividend[_mid] - _totalWithdrawnFunds(_mid));

        require(_dividendAmount > 0, "Dividend amount must be greater than 0");

        // Accumulate to the total distribution amount
        totalDividend[_mid] += _dividendAmount;

        // Calculate the dividend payment for each share
        uint256 dividendPaymentEachShare = (_dividendAmount) / totalShares[_mid];

        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            address shareholderAddr = shareholderAddressesList[_mid][i];
            Shareholder storage shareholder = shareholdersList[_mid][shareholderAddr];
            uint256 dividendPayment = shareholder.shares * dividendPaymentEachShare;
            shareholder.dividendBalance += dividendPayment;
        }
    }

    // Withdraw dividends
    function withdrawDividends(uint256 _sid, address holder) external {

        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);

        Shareholder storage shareholder = shareholdersList[_sMapKey][holder];
        require(shareholder.exists, "Shareholder does not exist");
        require(shareholder.dividendBalance > 0, "No dividends to withdraw");

        uint256 amountToWithdraw = shareholder.dividendBalance;
        shareholder.dividendBalance = 0;
        shareholder.totalWithdrawn += amountToWithdraw;
        payable(holder).transfer(amountToWithdraw);
    }

    // Get a list of all shareholders' addresses
    function getAllShareholders(uint256 _sid) public view returns (address[] memory) {
        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);

        return shareholderAddressesList[_sMapKey];
    }

    // Get the total withdrawn funds
    function totalWithdrawnFunds(uint256 _sid) public view returns (uint256) {

        (uint256 _sMapKey,) = getSidRelatedInfos(_sid);
        return _totalWithdrawnFunds(_sMapKey);

        // uint256 totalWithdrawn = 0;
        // for (uint256 i = 0; i < shareholderAddressesList[_sMapKey].length; i++) {
        //     address shareholderAddr = shareholderAddressesList[_sMapKey][i];
        //     totalWithdrawn += shareholdersList[_sMapKey][shareholderAddr].totalWithdrawn;
        // }
        // return totalWithdrawn;
    }

    function _totalWithdrawnFunds(uint256 _mid) internal view returns (uint256) {
        uint256 totalWithdrawn = 0;
        for (uint256 i = 0; i < shareholderAddressesList[_mid].length; i++) {
            address shareholderAddr = shareholderAddressesList[_mid][i];
            totalWithdrawn += shareholdersList[_mid][shareholderAddr].totalWithdrawn;
        }
        return totalWithdrawn;
    }
}