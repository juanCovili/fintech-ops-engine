import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/fintech_db',
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  IVA_PERCENTAGE: 0.19, // 19% IVA Chile (SII)
};
