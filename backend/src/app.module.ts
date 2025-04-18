import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PriceModule } from './price/price.module';
import { ConfigModule } from '@nestjs/config';
import { OracleModule } from './oracle/oracle.module'; // 👈 เพิ่มบรรทัดนี้

import * as path from 'path';

@Module({
  imports: [
    // Add the path to your .env file
    ConfigModule.forRoot({
      envFilePath: path.resolve(__dirname, '../.env'), // Adjust the path if needed
      isGlobal: true,
    }),
    PriceModule,
    OracleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
