import mongoose, { Schema, type Model, type Document } from 'mongoose';
import type { IFireHistory } from '../types';

interface FireHistoryDoc extends IFireHistory, Document {}

const featureSchema = new Schema({
  coordinates: { type: [Number], required: true },
  frp: Number, confidence: Number, satellite: String,
  instrument: { type: String, enum: ['VIIRS', 'MODIS'] },
  intensity: { type: String, enum: ['Faible', 'Modérée', 'Élevée', 'Extrême'] },
}, { _id: false });

const schema = new Schema<FireHistoryDoc>({
  timestamp: { type: Date, default: Date.now, index: true },
  source: { type: String, required: true },
  count: { type: Number, required: true },
  features: [featureSchema],
});

schema.index({ timestamp: -1 });

const FireHistory: Model<FireHistoryDoc> = mongoose.model<FireHistoryDoc>('FireHistory', schema);
export default FireHistory;
