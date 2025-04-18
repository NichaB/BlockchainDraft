import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ethers } from 'ethers';
import * as PriceOracle from '../../abis/PriceOracle.json';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SEPOLIA_RPC');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>(
      'ORACLE_CONTRACT_ADDRESS',
    );

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        '❌ Missing .env: SEPOLIA_RPC, PRIVATE_KEY, ORACLE_CONTRACT_ADDRESS',
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      PriceOracle.abi,
      this.wallet,
    );
  }

  // ✅ ดึงราคา ETH → THB จาก Binance + ERAPI
  public async getEthToThb(): Promise<number> {
    try {
      const ethUsdRes = await axios.get(
        'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
      );
      const ethUsd = parseFloat(ethUsdRes.data.price);

      const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD');
      const usdToThb = fxRes.data.rates.THB;

      const ethToThb = ethUsd * usdToThb;
      this.logger.log(
        `💰 1 ETH = ${ethToThb.toFixed(2)} THB (Binance + ERAPI)`,
      );

      return ethToThb;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('🚫 Failed to fetch ETH/THB:', error.message);
      } else {
        this.logger.error('🚫 Unknown error while fetching ETH/THB:', error);
      }
      throw new Error('Unable to fetch ETH → THB rate');
    }
  }

  // ✅ อัปเดตราคาล่าสุดเข้า Smart Contract
  public async pushEthRateToContract(): Promise<void> {
    try {
      const ethToThb = await this.getEthToThb();
      const rate = 1 / ethToThb;
      const rateInWei = ethers.parseUnits(rate.toFixed(18), 18);

      const tx = await this.contract.updateEthPerThb(rateInWei);
      this.logger.log(`📤 Tx sent: ${tx.hash}`);
      await tx.wait();
      this.logger.log(`✅ Updated oracle: 1 THB = ${rateInWei.toString()} wei`);
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error('🚫 Failed to update contract:', err.message);
      } else {
        this.logger.error('🚫 Unknown error updating contract:', err);
      }
    }
  }
}
