"use client";

import { useState } from "react";
import { ethers } from "ethers";
import InsuranceManagerABI from "../../abis/InsuranceManager.json";

const CONTRACT_ADDRESS = "0x186F4399b41328aC711124C9b282E65D32fb334F";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");

  // connect via MetaMask (ethers v6)
  async function connect() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return {};
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      InsuranceManagerABI.abi,
      signer
    );
    return { contract, address };
  }

  // fetch user profile from contract
  async function fetchProfile() {
    setStatus("");
    try {
      const { contract, address } = await connect();
      if (!contract || !address) {
        setStatus("❌ Wallet not connected");
        return;
      }
      const result = await contract.getUserProfile(address);
      setProfile(result);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to fetch profile.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">👤 My Profile</h1>

      <button onClick={fetchProfile} className="btn-blue mb-4">
        🔍 View Profile
      </button>

      {status && <p className="mb-4">{status}</p>}

      {profile && (
        <div className="mt-6 space-y-2">
          <p>
            <strong>Name:</strong> {profile.fullName}
          </p>
          <p>
            <strong>Age:</strong> {profile.age.toString()}
          </p>
          <p>
            <strong>Gender:</strong> {profile.gender}
          </p>
          <p>
            <strong>Occupation:</strong> {profile.occupation}
          </p>
          <p>
            <strong>Contact:</strong> {profile.contactInfo}
          </p>
        </div>
      )}

      <style jsx>{`
        .btn-blue {
          background: #3b82f6;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
        }
        .btn-blue:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
