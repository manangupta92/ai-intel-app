import mongoose, { Document, Model } from "mongoose";

export interface ISearchHistory extends Document {
  userId: string;
  company: {
    name: string;
    symbol: string;
  };
  createdAt: Date;
}

const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  company: {
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Keep only the last 10 searches per user
SearchHistorySchema.pre('save', async function(next) {
  const SearchHistory = this.constructor as Model<ISearchHistory>;
  const count = await SearchHistory.countDocuments({ userId: this.userId }).exec();
  if (count >= 10) {
    // Find and remove the oldest entry for this user
    const oldest = await SearchHistory.findOne(
      { userId: this.userId },
      {},
      { sort: { 'createdAt': 1 } }
    ).exec();
    if (oldest) {
      await SearchHistory.deleteOne({ _id: oldest._id }).exec();
    }
  }
  next();
});

export const SearchHistory = (mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema)) as Model<ISearchHistory>;

export default SearchHistory;
