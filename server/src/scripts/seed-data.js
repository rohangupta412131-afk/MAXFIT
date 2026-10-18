// MAXFIT Men's Catalog Seed Wrapper
import { seedMensCatalog } from '../../scripts/seed-mens-catalog.js';

seedMensCatalog()
  .then(() => {
    console.log('Men\'s catalog seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Men\'s catalog seed failed:', err);
    process.exit(1);
  });
