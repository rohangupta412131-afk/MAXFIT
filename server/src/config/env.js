import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://ryfyxehnxryikxvwugos.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  RZP_KEY_ID: process.env.RZP_KEY_ID || 'rzp_test_ToboxuZ2FU65dp',
  RZP_KEY_SECRET: process.env.RZP_KEY_SECRET || 'OhXe6lYAO4q1jIjbE5I1Ki7Y',
  RZP_WEBHOOK_SECRET: process.env.RZP_WEBHOOK_SECRET || 'test_webhook_secret_maxfit',
  HF_TOKEN: process.env.HF_TOKEN || '',
  HF_SPACE: process.env.HF_SPACE || 'yisol/IDM-VTON',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
