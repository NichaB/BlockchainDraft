// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title PriceOracle - On-chain oracle for ETH/THB rate
contract PriceOracle {
    uint256 public ethPerThb; // 1 THB = ? ETH (in wei)
    address public updater; // Only this address can update the rate

    event RateUpdated(uint256 newRate);

    modifier onlyUpdater() {
        require(msg.sender == updater, "Not authorized");
        _;
    }

    constructor(address _updater) {
        require(_updater != address(0), "Invalid updater");
        updater = _updater;
    }

    function updateEthPerThb(uint256 _ethPerThb) external onlyUpdater {
        require(_ethPerThb > 0, "Invalid rate");
        ethPerThb = _ethPerThb;
        emit RateUpdated(_ethPerThb);
    }

    function setUpdater(address _newUpdater) external onlyUpdater {
        require(_newUpdater != address(0), "Invalid address");
        updater = _newUpdater;
    }
}