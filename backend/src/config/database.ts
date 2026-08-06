import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn('⚠️ MONGODB_URI non défini, base de données désactivée');
    return;
  }
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.warn(`⚠️ MongoDB non disponible: ${msg}`);
  }
};
