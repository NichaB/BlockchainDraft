"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import InsuranceManagerABI from "../abis/InsuranceManager.json";

const CONTRACT_ADDRESS = "0x186F4399b41328aC711124C9b282E65D32fb334F";
const API_URL = "http://localhost:4000"; // your API endpoint

export default function Home() {
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "male",
    occupation: "",
    contactInfo: "",
    sumAssured: "",
    plan: "1",
  });
  const [premium, setPremium] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // fetch ETH → THB price from your API every minute
  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const res = await fetch(`${API_URL}/price/eththb`);
        const data = await res.json();
        setEthPrice(data.ethToThb);
      } catch (err) {
        console.error("Failed to fetch ETH/THB:", err);
        setEthPrice(null);
      }
    }
    fetchEthPrice();
    const id = setInterval(fetchEthPrice, 3000);
    return () => clearInterval(id);
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return {};
    }
    // For ethers v6, use BrowserProvider instead of Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { signer, address };
  }

  async function preview() {
    if (!form.plan || !form.age || !form.sumAssured) {
      setStatus("❌ Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { signer, address } = await connectWallet();
      if (!signer || !address) {
        setStatus("❌ Wallet not connected");
        return;
      }
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        InsuranceManagerABI.abi,
        signer
      );
      const raw = await contract.previewPremiumForPlan(
        parseInt(form.plan, 10),
        parseInt(form.age, 10),
        form.gender,
        form.occupation,
        parseInt(form.sumAssured, 10),
        address
      );
      setPremium(raw);
      setStatus(`💡 Estimated Premium: ${ethers.formatEther(raw)} ETH`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to preview premium");
    } finally {
      setLoading(false);
    }
  }

  async function purchase() {
    setLoading(true);
    try {
      const { signer, address } = await connectWallet();
      if (!signer || !address || !premium) {
        setStatus("❌ Connect wallet and preview first");
        return;
      }
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        InsuranceManagerABI.abi,
        signer
      );
      const tx = await contract.purchase(
        form.plan,
        form.fullName,
        parseInt(form.age, 10),
        form.gender,
        form.occupation,
        form.contactInfo,
        parseInt(form.sumAssured, 10),
        { value: premium }
      );
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();
      setStatus("✅ Insurance purchased successfully!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-6 py-12">
      {/* NAVBAR */}
      <nav className="flex justify-center gap-4 mb-8">
        <Link href="/policy">
          <button className="btn-gray">📄 My Policy</button>
        </Link>
        <Link href="/claim">
          <button className="btn-gray">🧾 My Claim</button>
        </Link>
        <Link href="/profile">
          <button className="btn-gray">👤 My Profile</button>
        </Link>
      </nav>

      {/* ETH/THB PRICE */}
      {ethPrice != null && (
        <div className="text-center text-green-400 mb-6">
          📈 1 ETH ≈ {ethPrice.toLocaleString()} THB
        </div>
      )}

      {/* FORM */}
      <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-center">🛡️ Buy Insurance</h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            name="fullName"
            placeholder="Full Name"
            onChange={handleChange}
            className="input"
          />
          <input
            name="age"
            type="number"
            placeholder="Age"
            onChange={handleChange}
            className="input"
          />
          <select name="gender" onChange={handleChange} className="input">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            name="occupation"
            placeholder="Occupation"
            onChange={handleChange}
            className="input"
          />
          <input
            name="contactInfo"
            placeholder="Contact Info"
            onChange={handleChange}
            className="input col-span-2"
          />
          <input
            name="sumAssured"
            type="number"
            placeholder="Sum Assured (THB)"
            onChange={handleChange}
            className="input col-span-2"
          />
          <select
            name="plan"
            onChange={handleChange}
            className="input col-span-2"
          >
            <option value="1">LifeGuard99</option>
            <option value="2">SmartReturn 80/6</option>
          </select>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-4">
          <button onClick={preview} className="btn-blue">
            📊 Preview Premium
          </button>
          <button
            onClick={purchase}
            disabled={!premium || loading}
            className="btn-green"
          >
            {loading ? "Processing..." : "💸 Purchase"}
          </button>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="loader"></div>
          </div>
        )}

        <p className="text-center whitespace-pre-wrap">{status}</p>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .input {
          background: #1f2937;
          border: 1px solid #374151;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          color: white;
          width: 100%;
        }
        .btn-blue {
          background: #3b82f6;
          padding: 0.5rem 1.2rem;
          border-radius: 0.375rem;
          font-weight: 600;
        }
        .btn-green {
          background: #10b981;
          padding: 0.5rem 1.2rem;
          border-radius: 0.375rem;
          font-weight: 600;
        }
        .btn-gray {
          background: #6b7280;
          padding: 0.5rem 1.2rem;
          border-radius: 0.375rem;
          font-weight: 600;
        }
        .btn-blue:hover,
        .btn-green:hover,
        .btn-gray:hover {
          opacity: 0.9;
        }
        .loader {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
