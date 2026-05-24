import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { GscPerformance } from "../../models/GscPerformance.model";
import { GscProperty, type IGscProperty } from "../../models/GscProperty.model";
import { Website } from "../../models/Website.model";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { enqueueGscSync, scheduleGscPropertySync } from "../../jobs/queues";
import type {
  ConnectGscPropertyInput,
  GscAuthUrlInput,
  PerformanceQuery,
  SyncGscPropertyInput,
} from "./gsc.validation";

const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return formatDate(date);
};

const getOAuthClient = (redirectUri?: string): OAuth2Client => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError("Google OAuth credentials are not configured.", 503);
  }

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri || env.GOOGLE_REDIRECT_URI
  );
};

const getPropertyWithAccess = async (
  propertyId: string,
  userId?: string
): Promise<IGscProperty> => {
  const filter: Record<string, unknown> = { _id: propertyId };
  if (userId) filter.userId = userId;

  const property = await GscProperty.findOne(filter).select(
    "+accessToken +refreshToken"
  );
  if (!property) throw new AppError("Search Console property not found.", 404);

  return property;
};

export const getGscAuthUrl = (
  _userId: string,
  input: GscAuthUrlInput
): { url: string; scopes: string[] } => {
  const client = getOAuthClient(input.redirectUri);
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GSC_SCOPES,
  });

  return { url, scopes: GSC_SCOPES };
};

export const connectGscProperty = async (
  userId: string,
  input: ConnectGscPropertyInput
): Promise<IGscProperty> => {
  if (input.websiteId) {
    const website = await Website.exists({ _id: input.websiteId, userId });
    if (!website) throw new AppError("Website not found.", 404);
  }

  const client = getOAuthClient(input.redirectUri);
  const { tokens } = await client.getToken(input.code);

  if (!tokens.refresh_token && !tokens.access_token) {
    throw new AppError("Google did not return OAuth tokens.", 400);
  }

  const propertyType = input.siteUrl.startsWith("sc-domain:")
    ? "domain"
    : "url_prefix";

  const property = await GscProperty.findOneAndUpdate(
    { userId, siteUrl: input.siteUrl },
    {
      $set: {
        userId,
        websiteId: input.websiteId,
        siteUrl: input.siteUrl,
        propertyType,
        scopes: GSC_SCOPES,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        status: "connected",
        lastSyncError: undefined,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  await scheduleGscPropertySync(property.id).catch(async (error) => {
    property.lastSyncError = `GSC scheduler unavailable: ${
      error instanceof Error ? error.message : String(error)
    }`;
    await property.save();
  });
  return property;
};

export const listGscProperties = async (userId: string) => {
  const properties = await GscProperty.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return { properties };
};

export const enqueueGscPropertySync = async (
  propertyId: string,
  userId: string,
  input: SyncGscPropertyInput
) => {
  await getPropertyWithAccess(propertyId, userId);
  const job = await enqueueGscSync({
    propertyId,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  return { jobId: job?.id ?? "unavailable" };
};

export const syncGscProperty = async (
  propertyId: string,
  input: SyncGscPropertyInput = {}
): Promise<{ imported: number; startDate: string; endDate: string }> => {
  const property = await getPropertyWithAccess(propertyId);
  const client = getOAuthClient();

  client.setCredentials({
    access_token: property.accessToken,
    refresh_token: property.refreshToken,
    expiry_date: property.tokenExpiryDate?.getTime(),
  });

  const endDate = input.endDate || daysAgo(3);
  const startDate = input.startDate || daysAgo(10);

  property.status = "syncing";
  property.lastSyncError = undefined;
  await property.save();

  try {
    const webmasters = google.webmasters({ version: "v3", auth: client });
    const response = await webmasters.searchanalytics.query({
      siteUrl: property.siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date", "query", "page", "country", "device"],
        rowLimit: 25_000,
        searchType: "web",
      },
    });

    const rows = response.data.rows || [];
    const writes = rows.map((row) => {
      const [date, query, page, country, device] = row.keys || [];
      return {
        updateOne: {
          filter: {
            propertyId: property._id,
            date,
            query,
            page,
            country,
            device,
          },
          update: {
            $set: {
              userId: property.userId,
              propertyId: property._id,
              siteUrl: property.siteUrl,
              date,
              query,
              page,
              country,
              device,
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || 0,
              position: row.position || 0,
            },
          },
          upsert: true,
        },
      };
    });

    if (writes.length > 0) {
      await GscPerformance.bulkWrite(writes, { ordered: false });
    }

    property.status = "connected";
    property.lastSyncedAt = new Date();
    await property.save();

    return { imported: writes.length, startDate, endDate };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    property.status = message.includes("invalid_grant") ? "needs_reauth" : "failed";
    property.lastSyncError = message;
    await property.save();
    throw error;
  }
};

export const getGscPerformance = async (
  propertyId: string,
  userId: string,
  query: PerformanceQuery
) => {
  await getPropertyWithAccess(propertyId, userId);

  const filter: Record<string, unknown> = { propertyId, userId };
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) (filter.date as Record<string, string>).$gte = query.startDate;
    if (query.endDate) (filter.date as Record<string, string>).$lte = query.endDate;
  }
  if (query.query) filter.query = { $regex: query.query, $options: "i" };
  if (query.page) filter.page = { $regex: query.page, $options: "i" };
  if (query.country) filter.country = query.country;
  if (query.device) filter.device = query.device;

  const rows = await GscPerformance.find(filter)
    .sort({ date: -1, clicks: -1 })
    .limit(query.limit)
    .lean();

  const totals = rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
      weightedPosition:
        acc.weightedPosition + row.position * Math.max(row.impressions, 1),
      positionWeight: acc.positionWeight + Math.max(row.impressions, 1),
    }),
    { clicks: 0, impressions: 0, weightedPosition: 0, positionWeight: 0 }
  );

  return {
    rows,
    totals: {
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      position:
        totals.positionWeight > 0
          ? totals.weightedPosition / totals.positionWeight
          : 0,
    },
  };
};
