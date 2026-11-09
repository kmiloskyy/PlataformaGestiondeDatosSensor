import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicionModule } from './medicion/medicion.module.js';
import { IngestaModule } from './ingesta/ingesta.module.js';
import { ConsultasModule } from './consultas/consultas.module.js';
import { SeedModule } from './seed/seed.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'dev_user'),
        password: config.get<string>('DB_PASSWORD', 'dev_password'),
        database: config.get<string>('DB_DATABASE', 'dev_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, 
      }),
    }),
    MedicionModule,
    IngestaModule,
    ConsultasModule,
    SeedModule,
  ],
})
export class AppModule {}
