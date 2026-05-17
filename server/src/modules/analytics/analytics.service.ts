import { Keyword } from "../../models/Keyword.model";
import { Website } from "../../models/Website.model";
import { Notification } from "../../models/Notification.model";
import { normalizeDomain } from "../../utils/domain";

export const getDashboardKPIs = async (userId: string, domain?: string) => {
  const filter: any = { userId, lastCheckStatus: "completed" };
  if (domain) {
    filter.domain = normalizeDomain(domain);
  }

  const keywords = await Keyword.find(filter).lean();
  
  const totalKeywords = keywords.length;
  let totalPosition = 0;
  let keywordsInTop10 = 0;
  let keywordsInTop3 = 0;
  let visibilityScore = 0;

  const ESTIMATED_CTR: Record<number, number> = {
    1: 0.317, 2: 0.247, 3: 0.186, 4: 0.136, 5: 0.095,
    6: 0.062, 7: 0.041, 8: 0.031, 9: 0.021, 10: 0.011,
  };

  const movers = {
    up: [] as Array<{ keyword: string; change: number; position: number }>,
    down: [] as Array<{ keyword: string; change: number; position: number }>,
  };

  keywords.forEach((kw) => {
    const pos = kw.lastPosition || 100;
    totalPosition += pos;

    if (pos <= 10) keywordsInTop10++;
    if (pos <= 3) keywordsInTop3++;
    
    // Calculate visibility
    const volume = 500; // Mock volume or fetch if stored
    if (pos <= 10) {
      visibilityScore += volume * (ESTIMATED_CTR[pos] || 0);
    }

    // Movers (if previous position exists)
    const prevPos = kw.previousPosition || pos;
    const change = prevPos - pos; // Positive means moved UP (e.g. 5 -> 2 = +3)
    
    if (change > 0) {
      movers.up.push({ keyword: kw.keyword, change, position: pos });
    } else if (change < 0) {
      movers.down.push({ keyword: kw.keyword, change, position: pos });
    }
  });

  // Sort movers
  movers.up.sort((a, b) => b.change - a.change);
  movers.down.sort((a, b) => a.change - b.change); // biggest drop first

  const avgPosition = totalKeywords > 0 ? (totalPosition / totalKeywords) : 0;

  return {
    totalKeywords,
    avgPosition: Number(avgPosition.toFixed(1)),
    visibilityScore: Math.round(visibilityScore),
    keywordsInTop10,
    keywordsInTop3,
    topMovers: {
      up: movers.up.slice(0, 5),
      down: movers.down.slice(0, 5),
    }
  };
};

export const getNotifications = async (userId: string, limit = 20) => {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  );
};
