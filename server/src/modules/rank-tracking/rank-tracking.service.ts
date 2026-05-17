import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import { Keyword, type IKeyword } from "../../models/Keyword.model";
import { RankAlert } from "../../models/RankAlert.model";
import { RankCheck, type IRankCheck } from "../../models/RankCheck.model";
import { User } from "../../models/User.model";
import { Website } from "../../models/Website.model";
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from "../../config/constants";
import { AppError } from "../../utils/AppError";
import { normalizeDomain } from "../../utils/domain";
import { logger } from "../../utils/logger";
import {
  enqueueRankCheck,
  removeKeywordRankScheduler,
  scheduleKeywordRankCheck,
} from "../../jobs/queues";
import { findRankingMatch } from "../../services/serp/rank-matcher";
import { runSerpSearch } from "../../services/serp/serp.service";
import type { SerpFeatureType, SerpLocation } from "../../services/serp/serp.types";
import type {
  AlertQuery,
  BulkImportInput,
  CreateKeywordInput,
  GeoGridCheckInput,
  KeywordListQuery,
  UpdateKeywordInput,
} from "./rank-tracking.validation";

interface PerformRankCheckOptions {
  reason: "scheduled" | "manual" | "geo_grid";
  location?: SerpLocation;
  onProgress?: (progress: number) => Promise<void> | void;
}

const normalizeStringList = (values: string[] = []): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const getUserKeywordLimit = async (userId: string): Promise<number> => {
  const user = await User.findById(userId).select("subscription.plan").lean();
  if (!user) throw new AppError("User not found.", 404);

  const plan = user.subscription.plan as SubscriptionPlan;
  return SUBSCRIPTION_LIMITS[plan].keywordLimit;
};

const ensureKeywordLimit = async (userId: string): Promise<void> => {
  const [limit, keywordCount] = await Promise.all([
    getUserKeywordLimit(userId),
    Keyword.countDocuments({ userId, status: "active" }),
  ]);

  if (keywordCount >= limit) {
    throw new AppError("Keyword limit reached for your subscription plan.", 403);
  }
};

const resolveDomainContext = async (
  userId: string,
  input: Pick<CreateKeywordInput, "websiteId" | "domain">
): Promise<{
  domain: string;
  websiteId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
}> => {
  if (input.websiteId) {
    const website = await Website.findOne({ _id: input.websiteId, userId });
    if (!website) {
      throw new AppError("Website not found.", 404);
    }

    return {
      domain: normalizeDomain(website.domain),
      websiteId: website._id as mongoose.Types.ObjectId,
      projectId: website.projectId,
    };
  }

  if (!input.domain) {
    throw new AppError("Domain is required.", 400);
  }

  return { domain: normalizeDomain(input.domain) };
};

const syncKeywordScheduler = async (keyword: IKeyword): Promise<void> => {
  try {
    if (keyword.status === "active" && keyword.schedule.enabled) {
      await scheduleKeywordRankCheck(keyword.id, keyword.schedule.cron);
      keyword.schedule.lastScheduledAt = new Date();
      keyword.lastCheckError = undefined;
      await keyword.save();
      return;
    }

    await removeKeywordRankScheduler(keyword.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    keyword.lastCheckStatus = "failed";
    keyword.lastCheckError = `Rank scheduler unavailable: ${message}`;
    await keyword.save();
    logger.warn("Keyword scheduler sync failed", {
      keywordId: keyword.id,
      error: message,
    });
  }
};

export const createKeyword = async (
  userId: string,
  input: CreateKeywordInput
): Promise<IKeyword> => {
  if (input.status === "active") {
    await ensureKeywordLimit(userId);
  }

  const context = await resolveDomainContext(userId, input);

  try {
    const keyword = await Keyword.create({
      userId,
      websiteId: context.websiteId,
      projectId: context.projectId,
      domain: context.domain,
      keyword: input.keyword,
      searchEngine: input.searchEngine,
      locale: input.locale,
      device: input.device,
      group: input.group,
      tags: normalizeStringList(input.tags),
      competitors: normalizeStringList(input.competitors).map(normalizeDomain),
      status: input.status,
      schedule: input.schedule,
      geoTarget: input.geoTarget,
    });

    await syncKeywordScheduler(keyword);
    return keyword;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("This keyword is already tracked for the same domain and settings.", 409);
    }
    throw error;
  }
};

export const getKeywords = async (userId: string, query: KeywordListQuery) => {
  const filter: Record<string, unknown> = { userId };

  if (query.status) filter.status = query.status;
  if (query.domain) filter.domain = normalizeDomain(query.domain);
  if (query.tag) filter.tags = query.tag;
  if (query.search) {
    filter.keyword = { $regex: query.search, $options: "i" };
  }

  const [keywords, total] = await Promise.all([
    Keyword.find(filter)
      .sort({ updatedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Keyword.countDocuments(filter),
  ]);

  return { keywords, total, page: query.page, limit: query.limit };
};

export const getKeywordById = async (
  keywordId: string,
  userId: string
): Promise<IKeyword> => {
  const keyword = await Keyword.findOne({ _id: keywordId, userId });
  if (!keyword) {
    throw new AppError("Keyword not found.", 404);
  }

  return keyword;
};

export const updateKeyword = async (
  keywordId: string,
  userId: string,
  input: UpdateKeywordInput
): Promise<IKeyword> => {
  const keyword = await getKeywordById(keywordId, userId);

  if (input.status === "active" && keyword.status !== "active") {
    await ensureKeywordLimit(userId);
  }

  if (input.domain) keyword.domain = normalizeDomain(input.domain);
  if (input.keyword) keyword.keyword = input.keyword;
  if (input.locale) keyword.locale = input.locale;
  if (input.device) keyword.device = input.device;
  if (input.group !== undefined) keyword.group = input.group || undefined;
  if (input.tags) keyword.tags = normalizeStringList(input.tags);
  if (input.competitors) {
    keyword.competitors = normalizeStringList(input.competitors).map(normalizeDomain);
  }
  if (input.status) keyword.status = input.status;
  if (input.schedule) {
    keyword.schedule = {
      ...keyword.schedule,
      ...input.schedule,
    };
  }
  if (input.geoTarget !== undefined) {
    keyword.geoTarget = input.geoTarget || undefined;
  }

  await keyword.save();
  await syncKeywordScheduler(keyword);

  return keyword;
};

export const deleteKeyword = async (
  keywordId: string,
  userId: string
): Promise<void> => {
  const keyword = await getKeywordById(keywordId, userId);
  await removeKeywordRankScheduler(keyword.id).catch((error) => {
    logger.warn("Failed to remove keyword scheduler during delete", {
      keywordId: keyword.id,
      error: error instanceof Error ? error.message : String(error),
    });
  });
  await Promise.all([
    RankCheck.deleteMany({ keywordId: keyword._id, userId }),
    RankAlert.deleteMany({ keywordId: keyword._id, userId }),
  ]);
  await Keyword.findByIdAndDelete(keyword._id);
};

export const enqueueManualRankCheck = async (
  keywordId: string,
  userId: string,
  location?: SerpLocation
) => {
  const keyword = await getKeywordById(keywordId, userId);
  keyword.lastCheckStatus = "queued";
  await keyword.save();

  const job = await enqueueRankCheck({
    keywordId: keyword.id,
    reason: location ? "geo_grid" : "manual",
    location,
  });

  return { jobId: job.id, keyword };
};

const createRankMovementAlert = async (
  keyword: IKeyword,
  rankCheck: IRankCheck,
  change?: number
): Promise<void> => {
  if (!change || Math.abs(change) < 5 || !rankCheck.position) return;

  const type = change > 0 ? "rank_gain" : "rank_loss";
  await RankAlert.create({
    userId: keyword.userId,
    keywordId: keyword._id,
    rankCheckId: rankCheck._id,
    type,
    severity: change > 0 ? "info" : "warning",
    previousPosition: rankCheck.previousPosition,
    currentPosition: rankCheck.position,
    delta: change,
    message:
      change > 0
        ? `${keyword.keyword} gained ${change} positions to #${rankCheck.position}.`
        : `${keyword.keyword} lost ${Math.abs(change)} positions to #${rankCheck.position}.`,
  });
};

const createFeatureAlerts = async (
  keyword: IKeyword,
  previousCheck: IRankCheck | null,
  rankCheck: IRankCheck
): Promise<void> => {
  const previousOwned = new Set(
    previousCheck?.serpFeatures
      .filter((feature) => feature.owned)
      .map((feature) => feature.type) || []
  );
  const currentOwned = new Set(
    rankCheck.serpFeatures.filter((feature) => feature.owned).map((feature) => feature.type)
  );

  const alertWrites: Array<Promise<unknown>> = [];

  currentOwned.forEach((featureType) => {
    if (!previousOwned.has(featureType)) {
      alertWrites.push(
        RankAlert.create({
          userId: keyword.userId,
          keywordId: keyword._id,
          rankCheckId: rankCheck._id,
          type: "feature_gain",
          severity: "info",
          featureType: featureType as SerpFeatureType,
          message: `${keyword.keyword} gained ${featureType.replace(/_/g, " ")} ownership.`,
        })
      );
    }
  });

  previousOwned.forEach((featureType) => {
    if (!currentOwned.has(featureType)) {
      alertWrites.push(
        RankAlert.create({
          userId: keyword.userId,
          keywordId: keyword._id,
          rankCheckId: rankCheck._id,
          type: "feature_loss",
          severity: "warning",
          featureType: featureType as SerpFeatureType,
          message: `${keyword.keyword} lost ${featureType.replace(/_/g, " ")} ownership.`,
        })
      );
    }
  });

  if (previousCheck?.aiOverview.citesDomain !== rankCheck.aiOverview.citesDomain) {
    alertWrites.push(
      RankAlert.create({
        userId: keyword.userId,
        keywordId: keyword._id,
        rankCheckId: rankCheck._id,
        type: rankCheck.aiOverview.citesDomain
          ? "ai_visibility_gain"
          : "ai_visibility_loss",
        severity: rankCheck.aiOverview.citesDomain ? "info" : "warning",
        featureType: "ai_overview",
        message: rankCheck.aiOverview.citesDomain
          ? `${keyword.keyword} is now cited in an AI Overview.`
          : `${keyword.keyword} is no longer cited in an AI Overview.`,
      })
    );
  }

  await Promise.all(alertWrites);
};

export const performRankCheck = async (
  keywordId: string,
  options: PerformRankCheckOptions
): Promise<IRankCheck> => {
  const keyword = await Keyword.findById(keywordId);
  if (!keyword) throw new AppError("Keyword not found.", 404);
  if (keyword.status !== "active" && options.reason !== "manual") {
    throw new AppError("Keyword is paused.", 400);
  }

  keyword.lastCheckStatus = "checking";
  keyword.lastCheckError = undefined;
  await keyword.save();
  await options.onProgress?.(20);

  const effectiveLocation = options.location || keyword.geoTarget;
  const previousCheckFilter: Record<string, unknown> = {
    keywordId: keyword._id,
    status: "completed",
  };

  if (effectiveLocation?.latitude !== undefined && effectiveLocation.longitude !== undefined) {
    previousCheckFilter["location.latitude"] = effectiveLocation.latitude;
    previousCheckFilter["location.longitude"] = effectiveLocation.longitude;
  } else {
    previousCheckFilter["location.latitude"] = { $exists: false };
  }

  const previousCheck = await RankCheck.findOne(previousCheckFilter).sort({
    checkedAt: -1,
  });

  try {
    const serpResult = await runSerpSearch({
      keyword: keyword.keyword,
      domain: keyword.domain,
      searchEngine: keyword.searchEngine,
      locale: keyword.locale,
      device: keyword.device,
      location: effectiveLocation,
    });
    await options.onProgress?.(70);

    const match = findRankingMatch(keyword.domain, serpResult);
    const previousPosition = previousCheck?.position;
    const change =
      previousPosition && match.position ? previousPosition - match.position : undefined;

    const rankCheck = await RankCheck.create({
      userId: keyword.userId,
      keywordId: keyword._id,
      websiteId: keyword.websiteId,
      domain: keyword.domain,
      keyword: keyword.keyword,
      searchEngine: keyword.searchEngine,
      locale: keyword.locale,
      device: keyword.device,
      location: effectiveLocation,
      source: serpResult.provider,
      status: "completed",
      checkedAt: new Date(),
      found: match.found,
      position: match.position,
      previousPosition,
      change,
      url: match.url,
      title: match.title,
      snippet: match.snippet,
      organicResults: serpResult.organicResults,
      serpFeatures: serpResult.serpFeatures,
      aiOverview: serpResult.aiOverview,
      providerMetadata: serpResult.rawMetadata,
    });

    keyword.lastPosition = match.position;
    keyword.lastUrl = match.url;
    keyword.lastCheckedAt = rankCheck.checkedAt;
    keyword.lastCheckStatus = "completed";
    if (match.position) {
      keyword.bestPosition = keyword.bestPosition
        ? Math.min(keyword.bestPosition, match.position)
        : match.position;
    }
    await keyword.save();

    await createRankMovementAlert(keyword, rankCheck, change);
    await createFeatureAlerts(keyword, previousCheck, rankCheck);
    await options.onProgress?.(90);

    return rankCheck;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    keyword.lastCheckStatus = "failed";
    keyword.lastCheckError = message;
    keyword.lastCheckedAt = new Date();
    await keyword.save();

    await RankCheck.create({
      userId: keyword.userId,
      keywordId: keyword._id,
      websiteId: keyword.websiteId,
      domain: keyword.domain,
      keyword: keyword.keyword,
      searchEngine: keyword.searchEngine,
      locale: keyword.locale,
      device: keyword.device,
      location: effectiveLocation,
      source: "manual",
      status: "failed",
      checkedAt: new Date(),
      found: false,
      organicResults: [],
      serpFeatures: [],
      aiOverview: { present: false, citesDomain: false, citations: [] },
      errorMessage: message,
    });

    logger.error("Rank check failed", { keywordId, error: message });
    throw error;
  }
};

export const importKeywordsFromCsv = async (
  userId: string,
  input: BulkImportInput
) => {
  const rows = parse(input.csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const result = {
    imported: 0,
    skipped: 0,
    errors: [] as Array<{ row: number; message: string }>,
  };

  for (const [index, row] of rows.entries()) {
    try {
      await createKeyword(userId, {
        domain: row.domain,
        keyword: row.keyword,
        searchEngine: "google",
        locale: row.locale || "en-US",
        device: row.device === "mobile" ? "mobile" : "desktop",
        group: row.group || undefined,
        tags: row.tags ? row.tags.split(";").map((tag) => tag.trim()) : [],
        competitors: row.competitors
          ? row.competitors.split(";").map((domain) => domain.trim())
          : [],
        status: "active",
        schedule: {
          enabled: row.scheduleEnabled !== "false",
          cron: row.cron || "0 3 * * *",
          timezone: row.timezone || "UTC",
        },
      });
      result.imported += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
};

export const getKeywordTrend = async (
  keywordId: string,
  userId: string,
  days: number
) => {
  await getKeywordById(keywordId, userId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const checks = await RankCheck.find({
    keywordId,
    userId,
    checkedAt: { $gte: since },
    status: "completed",
  })
    .sort({ checkedAt: 1 })
    .select("checkedAt position previousPosition change found url source aiOverview serpFeatures location")
    .lean();

  return { checks };
};

export const getRankAlerts = async (userId: string, query: AlertQuery) => {
  const filter: Record<string, unknown> = { userId };
  if (query.unreadOnly) filter.readAt = { $exists: false };

  const [alerts, total] = await Promise.all([
    RankAlert.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    RankAlert.countDocuments(filter),
  ]);

  return { alerts, total, page: query.page, limit: query.limit };
};

export const markAlertRead = async (
  alertId: string,
  userId: string
) => {
  const alert = await RankAlert.findOneAndUpdate(
    { _id: alertId, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!alert) throw new AppError("Alert not found.", 404);
  return alert;
};

export const getSerpFeatureSummary = async (userId: string, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const summary = await RankCheck.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), checkedAt: { $gte: since } } },
    { $unwind: "$serpFeatures" },
    {
      $group: {
        _id: {
          type: "$serpFeatures.type",
          owned: "$serpFeatures.owned",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.type": 1 } },
  ]);

  return { summary };
};

const createGeoGrid = (input: GeoGridCheckInput): SerpLocation[] => {
  const points: SerpLocation[] = [];
  const half = Math.floor(input.gridSize / 2);
  const latStep = input.radiusKm / 111 / Math.max(half, 1);
  const lngStep =
    input.radiusKm /
    (111 * Math.cos((input.center.latitude * Math.PI) / 180)) /
    Math.max(half, 1);

  for (let row = -half; row <= half; row += 1) {
    for (let col = -half; col <= half; col += 1) {
      const latitude = Number((input.center.latitude + row * latStep).toFixed(6));
      const longitude = Number((input.center.longitude + col * lngStep).toFixed(6));
      points.push({
        name: input.center.name || `${latitude},${longitude}`,
        latitude,
        longitude,
      });
    }
  }

  return points;
};

export const enqueueGeoGridChecks = async (
  keywordId: string,
  userId: string,
  input: GeoGridCheckInput
) => {
  await getKeywordById(keywordId, userId);
  const points = createGeoGrid(input);
  const jobs = await Promise.all(
    points.map((location) =>
      enqueueRankCheck({
        keywordId,
        reason: "geo_grid",
        location,
      })
    )
  );

  return {
    points,
    jobIds: jobs.map((job) => job.id),
  };
};

export const getLatestGeoGrid = async (
  keywordId: string,
  userId: string
) => {
  await getKeywordById(keywordId, userId);
  const checks = await RankCheck.find({
    keywordId,
    userId,
    "location.latitude": { $exists: true },
    "location.longitude": { $exists: true },
    status: "completed",
  })
    .sort({ checkedAt: -1 })
    .limit(200)
    .lean();

  const latestByPoint = new Map<string, (typeof checks)[number]>();
  checks.forEach((check) => {
    const key = `${check.location?.latitude}:${check.location?.longitude}`;
    if (!latestByPoint.has(key)) latestByPoint.set(key, check);
  });

  return { checks: Array.from(latestByPoint.values()) };
};

export const getAiVisibility = async (
  userId: string,
  options: { keywordId?: string; domain?: string }
) => {
  const filter: Record<string, unknown> = { userId, status: "completed" };
  if (options.keywordId) {
    await getKeywordById(options.keywordId, userId);
    filter.keywordId = new mongoose.Types.ObjectId(options.keywordId);
  }
  if (options.domain) filter.domain = normalizeDomain(options.domain);

  const stats = await RankCheck.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        aiOverviewPresent: {
          $sum: { $cond: ["$aiOverview.present", 1, 0] },
        },
        citesDomain: {
          $sum: { $cond: ["$aiOverview.citesDomain", 1, 0] },
        },
      },
    },
  ]);

  const totals = stats[0] || {
    totalChecks: 0,
    aiOverviewPresent: 0,
    citesDomain: 0,
  };

  return {
    ...totals,
    citationRate:
      totals.totalChecks > 0 ? totals.citesDomain / totals.totalChecks : 0,
  };
};
