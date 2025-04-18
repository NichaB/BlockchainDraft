import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get('eththb')
  async getEthToThb() {
    try {
      const ethToThb = await this.priceService.getEthToThb();
      return { ethToThb };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch price',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('push')
  async pushEthRate() {
    try {
      await this.priceService.pushEthRateToContract();
      return { status: 'Updated' };
    } catch (error) {
      throw new HttpException(
        'Failed to update',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
