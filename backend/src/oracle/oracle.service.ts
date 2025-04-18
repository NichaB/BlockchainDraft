import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ethers } from 'ethers';
import * as cron from 'node-cron';
import * as PriceOracle from '../../abis/PriceOracle.json';

@Injectable()
export class OracleService implements OnModuleInit {
  private readonly logger = new Logger(OracleService.name);
  private provider!: ethers.JsonRpcProvider;
  private wallet!: ethers.Wallet;
  private contract!: ethers.Contract;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initialize();
    this.scheduleCronJob();
    this.updatePriceToContract(); // Run once at startup
  }

  private initialize() {
    const rpcUrl = this.configService.get<string>('SEPOLIA_RPC');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const oracleAddress = this.configService.get<string>(
      'ORACLE_CONTRACT_ADDRESS',
    );

    if (!rpcUrl || !privateKey || !oracleAddress) {
      throw new Error('❌ Missing environment variables for oracle config');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      oracleAddress,
      PriceOracle.abi,
      this.wallet,
    );
  }

  public async fetchEthToThb(): Promise<number> {
    try {
      // 1. Get ETH → USD from Binance
      const ethUsdRes = await axios.get(
        'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
      );
      const ethUsd = parseFloat(ethUsdRes.data.price);

      // 2. Get USD → THB from ERAPI (open.er-api.com)
      const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD');
      const usdToThb = fxRes.data.rates.THB;

      // 3. Calculate ETH → THB
      const ethToThb = ethUsd * usdToThb;

      this.logger.log(
        `💰 1 ETH = ${ethToThb.toFixed(2)} THB (via Binance + ERAPI)`,
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

  private async updatePriceToContract() {
    try {
      const ethToThb = await this.fetchEthToThb();
      const rate = 1 / ethToThb;
      const rateInWei = ethers.parseUnits(rate.toFixed(18), 18);

      const tx = await this.contract.updateEthPerThb(rateInWei);
      this.logger.log(`📤 Tx sent: ${tx.hash}`);
      await tx.wait();
      this.logger.log(
        `✅ Updated oracle → 1 THB = ${rateInWei.toString()} wei`,
      );
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error('🚫 Update failed:', err.message);
      } else {
        this.logger.error('🚫 Update failed with unknown error', err);
      }
    }
  }

  private scheduleCronJob() {
    this.logger.log('🕐 Cron job registered ✅'); // ใส่ตรงนี้ดูว่าเรียกมั้ย
    cron.schedule('*/30 * * * * *', () => {
      this.logger.log('⏱️ Running scheduled price update...');
      this.updatePriceToContract();
    });
  }
}
