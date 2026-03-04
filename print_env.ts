
import dotenv from 'dotenv';
dotenv.config({ override: true });
console.log('DB_HOST (overridden):', process.env.DB_HOST);
console.log('DB_USER (overridden):', process.env.DB_USER);
console.log('DB_NAME (overridden):', process.env.DB_NAME);
