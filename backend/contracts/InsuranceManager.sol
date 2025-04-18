// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PolicyBase.sol";
import "./LifeGuard99.sol";
import "./SmartReturn806.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InsuranceManager is Ownable {
    enum PlanType { None, LifeGuard99, SmartReturn806 }

    mapping(address => PlanType) public userPlan;
    PolicyBase public lifeGuard;
    PolicyBase public smartReturn;

    constructor(address _owner, address _lifeGuard, address _smartReturn)
        Ownable(_owner)
    {
        lifeGuard = PolicyBase(_lifeGuard);
        smartReturn = PolicyBase(_smartReturn);
    }

    // ✅ Preview premium BEFORE purchasing
    function previewPremiumForPlan(
        PlanType plan,
        uint8 age,
        string memory gender,
        string memory occupation,
        uint256 sumAssured,
        address user
    ) external view returns (uint256) {
        require(plan != PlanType.None, "Invalid plan");

        if (plan == PlanType.LifeGuard99) {
            return lifeGuard.previewPremium(age, gender, occupation, sumAssured, user);
        } else if (plan == PlanType.SmartReturn806) {
            return smartReturn.previewPremium(age, gender, occupation, sumAssured, user);
        } else {
            revert("Unknown plan");
        }
    }

    // ✅ Purchase policy
    function purchase(
        PlanType plan,
        string memory fullName,
        uint8 age,
        string memory gender,
        string memory occupation,
        string memory contactInfo,
        uint256 sumAssured
    ) external payable {
        require(plan == PlanType.LifeGuard99 || plan == PlanType.SmartReturn806, "Invalid plan");

        if (plan == PlanType.LifeGuard99) {
            lifeGuard.purchasePolicy{value: msg.value}(msg.sender, fullName, age, gender, occupation, contactInfo, sumAssured);
        } else {
            smartReturn.purchasePolicy{value: msg.value}(msg.sender, fullName, age, gender, occupation, contactInfo, sumAssured);
        }

        userPlan[msg.sender] = plan;
    }

    // ✅ Renew (only LifeGuard99)
    function renew() external payable {
        require(userPlan[msg.sender] == PlanType.LifeGuard99, "Only LifeGuard can renew");
        lifeGuard.renewPolicy{value: msg.value}(msg.sender, msg.value);
    }

    // ✅ Cancel + Refund
    function cancelAndRefund() external {
        PlanType plan = userPlan[msg.sender];
        uint256 refund;

        if (plan == PlanType.LifeGuard99) {
            refund = lifeGuard.calculateRefund(msg.sender);
            lifeGuard.cancelPolicy(msg.sender);
        } else if (plan == PlanType.SmartReturn806) {
            refund = smartReturn.calculateRefund(msg.sender);
            smartReturn.cancelPolicy(msg.sender);
        }

        payable(msg.sender).transfer(refund);
    }

    // ✅ File claim
    function fileClaim(uint256 amount, string memory documentHash) external {
        if (userPlan[msg.sender] == PlanType.LifeGuard99) {
            lifeGuard.fileClaim(msg.sender, amount, documentHash);
        } else if (userPlan[msg.sender] == PlanType.SmartReturn806) {
            smartReturn.fileClaim(msg.sender, amount, documentHash);
        }
    }

    // ✅ Approve claim (owner only)
    function approveClaim(address user) external onlyOwner {
        uint256 payout;
        if (userPlan[user] == PlanType.LifeGuard99) {
            payout = lifeGuard.approveClaim(user);
        } else if (userPlan[user] == PlanType.SmartReturn806) {
            payout = smartReturn.approveClaim(user);
        }

        payable(user).transfer(payout);
    }

    // 🔍 Getters
    function getPolicy(address user) external view returns (PolicyBase.Policy memory) {
        if (userPlan[user] == PlanType.LifeGuard99) {
            return lifeGuard.getPolicy(user);
        } else {
            return smartReturn.getPolicy(user);
        }
    }

    function getClaim(address user) external view returns (PolicyBase.ClaimRequest memory) {
        if (userPlan[user] == PlanType.LifeGuard99) {
            return lifeGuard.getClaim(user);
        } else {
            return smartReturn.getClaim(user);
        }
    }

    function getUserProfile(address user) external view returns (PolicyBase.UserProfile memory) {
        if (userPlan[user] == PlanType.LifeGuard99) {
            return lifeGuard.getUserProfile(user);
        } else {
            return smartReturn.getUserProfile(user);
        }
    }
}
