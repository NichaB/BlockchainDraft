// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PolicyBase.sol";
import "./PriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LifeGuard99 is PolicyBase, Ownable {
    uint256 private constant DURATION = 99 * 365 days;

    PriceOracle public oracle;

    constructor(address _owner, address _oracle) Ownable(_owner) {
        oracle = PriceOracle(_oracle);
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        oracle = PriceOracle(_oracle);
    }

    function purchasePolicy(
        address user,
        string memory fullName,
        uint8 age,
        string memory gender,
        string memory occupation,
        string memory contactInfo,
        uint256 sumAssured
    ) external payable override {
        uint256 premium = calculatePremium(age, gender, occupation, sumAssured);
        require(msg.value == premium, "Incorrect premium");

        userProfiles[user] = UserProfile(fullName, age, gender, occupation, contactInfo, user);
        policies[user] = Policy(premium, sumAssured, 0, block.timestamp + DURATION, true);
        emit PolicyPurchased(user, premium, sumAssured);
    }

    function previewPremium(
        uint8 age,
        string memory gender,
        string memory occupation,
        uint256 sumAssured,
        address
    ) external view override returns (uint256) {
        return calculatePremium(age, gender, occupation, sumAssured);
    }

    function calculatePremium(
        uint8 age,
        string memory gender,
        string memory occupation,
        uint256 sumAssured
    ) public view returns (uint256) {
        uint256 ethPerThb = oracle.ethPerThb();
        require(ethPerThb > 0, "ETH/THB not set");

        uint256 baseThbPremium = 1000;
        if (age < 25) baseThbPremium += 200;
        else if (age > 60) baseThbPremium += 300;

        if (keccak256(bytes(gender)) == keccak256(bytes("female"))) {
            baseThbPremium -= 100;
        }

        if (keccak256(bytes(occupation)) == keccak256(bytes("pilot"))) {
            baseThbPremium += 500;
        }

        uint256 totalThb = (baseThbPremium * sumAssured) / 100_000;
        return (totalThb * ethPerThb) / 1e18;
    }

    function renewPolicy(address user, uint256 premium) external payable override {
        require(block.timestamp >= policies[user].expiry, "Policy not expired");
        require(msg.value == premium, "Incorrect premium");

        policies[user].premium = premium;
        policies[user].expiry = block.timestamp + DURATION;
        policies[user].isActive = true;

        emit PolicyPurchased(user, premium, policies[user].sumAssured);
    }

    function cancelPolicy(address user) external override {
        policies[user].isActive = false;
        emit RefundIssued(user, 0);
    }

    function fileClaim(address user, uint256 amount, string memory documentHash) external override {
        Policy storage p = policies[user];
        require(p.isActive && block.timestamp < p.expiry, "Policy invalid");
        require(amount > 0 && amount <= p.sumAssured - p.claimAmount, "Invalid claim");
        require(!claims[user].isPending, "Pending exists");

        claims[user] = ClaimRequest(amount, documentHash, true);
        emit ClaimFiled(user, amount, documentHash);
    }

    function approveClaim(address user) external override onlyOwner returns (uint256) {
        ClaimRequest storage c = claims[user];
        Policy storage p = policies[user];
        require(c.isPending, "No pending claim");

        c.isPending = false;
        p.claimAmount += c.amount;
        emit ClaimApproved(user, c.amount);
        return c.amount;
    }

    function calculateRefund(address user) external view override returns (uint256) {
        Policy memory p = policies[user];
        if (!p.isActive || block.timestamp >= p.expiry) return 0;
        return (p.premium * (p.expiry - block.timestamp)) / DURATION;
    }

    function getPolicy(address user) external view override returns (Policy memory) {
        return policies[user];
    }

    function getClaim(address user) external view override returns (ClaimRequest memory) {
        return claims[user];
    }

    function getUserProfile(address user) external view override returns (UserProfile memory) {
        return userProfiles[user];
    }
}
