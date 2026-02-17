import { defineConfig } from '@prisma/config'
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    // This replaces the url = env("DATABASE_URL") from your schema
    url: process.env.DATABASE_URL,
  },
})