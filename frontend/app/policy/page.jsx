"use client";

import { useState } from "react";
import { ethers } from "ethers";
import InsuranceManagerABI from "../../abis/InsuranceManager.json";

const CONTRACT_ADDRESS = "0x186F4399b41328aC711124C9b282E65D32fb334F";

export default function PolicyPage() {
  const [policy, setPolicy] = useState(null);
  const [status, setStatus] = useState("");

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

  async function fetchPolicy() {
    setStatus("");
    try {
      const { contract, address } = await connect();
      if (!contract || !address) {
        setStatus("❌ Wallet not connected");
        return;
      }
      const p = await contract.getPolicy(address);
      setPolicy(p);
    } catch (e) {
      console.error(e);
      setStatus("❌ Failed to fetch policy.");
    }
  }

  // Helper to get numeric timestamp
  function toTimestamp(val) {
    // ethers v6 often returns JS bigint
    if (typeof val === "object" && val.toNumber) {
      return val.toNumber();
    }
    // if it's bigint or string
    return Number(val);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">📄 My Policy</h1>

      <button onClick={fetchPolicy} className="btn-blue mb-4">
        🔍 View Policy
      </button>

      {status && <p className="mb-4">{status}</p>}

      {policy && (
        <div className="mt-6 space-y-2">
          <p>
            <strong>Premium:</strong> {ethers.formatEther(policy.premium)} ETH
          </p>
          <p>
            <strong>Sum Assured:</strong> {policy.sumAssured.toString()} THB
          </p>
          <p>
            <strong>Claimed:</strong> {ethers.formatEther(policy.claimAmount)}{" "}
            ETH
          </p>
          <p>
            <strong>Expires:</strong>{" "}
            {new Date(toTimestamp(policy.expiry) * 1000).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {policy.isActive ? "✅ Active" : "❌ Inactive"}
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
