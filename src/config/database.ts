import mongoose from 'mongoose';
import { MONGODB_DATABASE_NAME, MONGODB_DATABASE_URL } from '../secrets';
import logger from './logger';

export const connectToDatabase = async (MAX_RETRIES: number): Promise<void> => {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGODB_DATABASE_URL!, {
        dbName: MONGODB_DATABASE_NAME!,
      });
      logger.debug('Database connected successfully!');
      return;
    } catch (error) {
      attempts += 1;
      logger.debug(
        `Error connecting to MongoDB (Attempt ${attempts}): ${error}`,
      );
      if (attempts === MAX_RETRIES) {
        logger.error('Max connection attempts reached. Exiting...');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};
