import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { Keyword } from "../../models/Keyword.model";
import { Backlink } from "../../models/Backlink.model";
import { Parser } from "json2csv";
import { normalizeDomain } from "../../utils/domain";

export const exportKeywordsCsv = asyncHandler(async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  const filter: any = { userId: req.user!.id };
  if (domain) filter.domain = normalizeDomain(domain);

  const keywords = await Keyword.find(filter).lean();
  
  if (!keywords.length) {
    res.status(404).json({ success: false, message: "No keywords found to export" });
    return;
  }

  const fields = ["keyword", "domain", "device", "locale", "lastPosition", "previousPosition", "lastCheckStatus", "updatedAt"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(keywords);

  res.header("Content-Type", "text/csv");
  res.attachment(`keywords-export-${domain || "all"}.csv`);
  res.send(csv);
});

export const exportBacklinksCsv = asyncHandler(async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  const filter: any = { userId: req.user!.id };
  if (domain) filter.targetDomain = normalizeDomain(domain);

  const backlinks = await Backlink.find(filter).lean();
  
  if (!backlinks.length) {
    res.status(404).json({ success: false, message: "No backlinks found to export" });
    return;
  }

  const fields = ["targetDomain", "domainFrom", "anchorText", "isDofollow", "domainRank", "spamScore", "toxicityStatus", "isLost", "disavowed", "updatedAt"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(backlinks);

  res.header("Content-Type", "text/csv");
  res.attachment(`backlinks-export-${domain || "all"}.csv`);
  res.send(csv);
});
