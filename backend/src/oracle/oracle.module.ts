import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';

@Module({
  imports: [ConfigModule], // ✅ เพิ่มตรงนี้!
  controllers: [OracleController],
  providers: [OracleService],
})
export class OracleModule {}
