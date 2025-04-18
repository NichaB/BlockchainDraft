"use client"

import { ethers } from "ethers";
import InsuranceManagerABI from "../abis/InsuranceManager.json"; // 👈 วาง ABI ที่ export มาจาก backend

export function getInsuranceManager(signerOrProvider, address) {
  return new ethers.Contract(address, InsuranceManagerABI.abi, signerOrProvider);
}
