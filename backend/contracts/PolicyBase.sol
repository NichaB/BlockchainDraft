// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract PolicyBase {
    struct UserProfile {
        string fullName;
        uint8 age;
        string gender;
        string occupation;
        string contactInfo;
        address wallet;
    }

    struct Policy {
        uint256 premium;
        uint256 sumAssured; // ✅ Added sumAssured
        uint256 claimAmount;
        uint256 expiry;
        bool isActive;
    }

    struct ClaimRequest {
        uint256 amount;
        string documentHash;
        bool isPending;
    }

    mapping(address => UserProfile) internal userProfiles;
    mapping(address => Policy) internal policies;
    mapping(address => ClaimRequest) internal claims;

    event PolicyPurchased(address indexed user, uint256 premium, uint256 sumAssured); // ✅ updated
    event ClaimFiled(address indexed user, uint256 amount, string documentHash);
    event ClaimApproved(address indexed user, uint256 amount);
    event RefundIssued(address indexed user, uint256 amount);

    function purchasePolicy(
        address user,
        string memory fullName,
        uint8 age,
        string memory gender,
        string memory occupation,
        string memory contactInfo,
        uint256 sumAssured // ✅ Added
    ) external virtual payable;

    function previewPremium(
        uint8 age,
        string memory gender,
        string memory occupation,
        uint256 sumAssured,
        address user
    ) external view virtual returns (uint256);


    function renewPolicy(address user, uint256 premium) external virtual payable;

    function cancelPolicy(address user) external virtual;

    function fileClaim(address user, uint256 amount, string memory documentHash) external virtual;

    function approveClaim(address user) external virtual returns (uint256);

    function calculateRefund(address user) external view virtual returns (uint256);

    function getPolicy(address user) external view virtual returns (Policy memory);

    function getClaim(address user) external view virtual returns (ClaimRequest memory);

    function getUserProfile(address user) external view virtual returns (UserProfile memory);
}
