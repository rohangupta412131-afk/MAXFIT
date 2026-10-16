import Razorpay from 'razorpay';
import { env } from './env.js';

export const razorpayInstance = new Razorpay({
  key_id: env.RZP_KEY_ID,
  key_secret: env.RZP_KEY_SECRET
});
