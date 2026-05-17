import { domainMatchesUrl } from "../../utils/domain";
import type { NormalizedSerpResult, RankingMatch } from "./serp.types";

export const findRankingMatch = (
  domain: string,
  serpResult: NormalizedSerpResult
): RankingMatch => {
  const result = serpResult.organicResults.find((item) =>
    domainMatchesUrl(domain, item.url)
  );

  if (!result) {
    return { found: false };
  }

  return {
    found: true,
    position: result.position,
    url: result.url,
    title: result.title,
    snippet: result.snippet,
  };
};
