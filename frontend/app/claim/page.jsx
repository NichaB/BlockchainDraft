"use client";

import { useState } from "react";
import { ethers } from "ethers";
import InsuranceManagerABI from "../../abis/InsuranceManager.json";

const CONTRACT_ADDRESS = "0x186F4399b41328aC711124C9b282E65D32fb334F";

export default function ClaimPage() {
  const [claim, setClaim] = useState(null);
  const [status, setStatus] = useState("");

  // connect to MetaMask and return contract + user address
  async function connect() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return {};
    }
    // ethers v6: use BrowserProvider
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

  // fetch the user's claim from smart contract
  async function fetchClaim() {
    setStatus(""); // clear previous status
    try {
      const { contract, address } = await connect();
      if (!contract || !address) {
        setStatus("❌ Wallet not connected");
        return;
      }
      const result = await contract.getClaim(address);
      setClaim(result);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to fetch claim.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">📄 My Claim Request</h1>

      <button onClick={fetchClaim} className="btn-blue mb-4">
        🔍 View Claim
      </button>

      {status && <p className="mb-4">{status}</p>}

      {claim && (
        <div className="mt-6 space-y-2">
          <p>
            <strong>Amount:</strong> {ethers.formatEther(claim.amount)} ETH
          </p>
          <p>
            <strong>Document Hash:</strong> {claim.documentHash}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {claim.isPending ? "⏳ Pending" : "✅ Approved"}
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
