import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`MAXFIT API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Base API:     http://localhost:${PORT}/api/v1`);
  console.log(`Client URL:   ${env.CLIENT_URL}`);
  console.log(`===============================================`);
});
