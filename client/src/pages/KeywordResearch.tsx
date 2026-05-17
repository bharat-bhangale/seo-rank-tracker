import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  Eye,
  FileText,
  Lightbulb,
  Loader2,
  PieChart,
  Search,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { keywordResearchApi } from "@/lib/keywordResearchApi";

export function KeywordResearchPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("example.com");
  const [activeTab, setActiveTab] = useState<"discovery" | "gap" | "clusters" | "visibility">("discovery");

  // Discovery State
  const [seed, setSeed] = useState("");
  const [submittedSeed, setSubmittedSeed] = useState("");

  // Gap State
  const [competitors, setCompetitors] = useState("");
  const [submittedCompetitors, setSubmittedCompetitors] = useState("");

  // Cluster State
  const [clusterInput, setClusterInput] = useState("");

  // Queries
  const ideasQuery = useQuery({
    queryKey: ["kw-ideas", submittedSeed],
    queryFn: () => keywordResearchApi.getIdeas(submittedSeed),
    enabled: Boolean(submittedSeed),
  });

  const gapQuery = useQuery({
    queryKey: ["kw-gap", domain, submittedCompetitors],
    queryFn: () => keywordResearchApi.getGap(domain, submittedCompetitors.split(",")),
    enabled: Boolean(domain) && Boolean(submittedCompetitors),
  });

  const clustersQuery = useQuery({
    queryKey: ["kw-clusters"],
    queryFn: () => keywordResearchApi.getClusters(),
  });

  const visibilityQuery = useQuery({
    queryKey: ["kw-visibility", domain],
    queryFn: () => keywordResearchApi.getVisibility(domain),
    enabled: Boolean(domain),
  });

  // Mutations
  const generateClusterMutation = useMutation({
    mutationFn: (keywords: string[]) => keywordResearchApi.generateClusters(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kw-clusters"] });
      setClusterInput("");
    },
  });

  const handleGenerateClusters = () => {
    const kws = clusterInput.split(",").map(s => s.trim()).filter(Boolean);
    if (kws.length >= 3) {
      generateClusterMutation.mutate(kws);
    } else {
      alert("Please provide at least 3 keywords.");
    }
  };

  const renderIntentBadge = (intent: string) => {
    switch (intent) {
      case "informational": return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Info</span>;
      case "navigational": return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Nav</span>;
      case "commercial": return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">Comm</span>;
      case "transactional": return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Trans</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Keyword Research & Content</h1>
          <p className="text-surface-500 mt-1">
            Discover opportunities, analyze competitor gaps, and build semantic content clusters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            className="input" 
            placeholder="Target domain..." 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
      </div>

      <div className="flex space-x-1 border-b border-surface-200">
        <button
          onClick={() => setActiveTab("discovery")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "discovery" ? "border-primary-600 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <Lightbulb className="inline-block w-4 h-4 mr-2" /> Discovery
        </button>
        <button
          onClick={() => setActiveTab("gap")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "gap" ? "border-primary-600 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <Search className="inline-block w-4 h-4 mr-2" /> Gap Analysis
        </button>
        <button
          onClick={() => setActiveTab("clusters")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "clusters" ? "border-primary-600 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <BrainCircuit className="inline-block w-4 h-4 mr-2" /> Topic Clusters
        </button>
        <button
          onClick={() => setActiveTab("visibility")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "visibility" ? "border-primary-600 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <Eye className="inline-block w-4 h-4 mr-2" /> Share of Voice
        </button>
      </div>

      {activeTab === "discovery" && (
        <div className="card space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="input flex-1" 
              placeholder="Enter a seed keyword..." 
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSubmittedSeed(seed)}
            />
            <button className="btn btn-primary" onClick={() => setSubmittedSeed(seed)}>
              <Search className="h-4 w-4" /> Analyze
            </button>
          </div>

          {ideasQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600 my-8" />}

          {ideasQuery.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-500">
                    <th className="py-2 font-medium">Keyword</th>
                    <th className="py-2 font-medium">Intent</th>
                    <th className="py-2 font-medium text-right">Volume</th>
                    <th className="py-2 font-medium text-right">KD</th>
                    <th className="py-2 font-medium text-right">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {ideasQuery.data.map((idea, idx) => (
                    <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-3 font-medium text-surface-900">{idea.keyword}</td>
                      <td className="py-3">{renderIntentBadge(idea.search_intent)}</td>
                      <td className="py-3 text-right">{idea.search_volume.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${idea.keyword_difficulty > 70 ? 'bg-red-100 text-red-700' : idea.keyword_difficulty > 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {idea.keyword_difficulty}
                        </span>
                      </td>
                      <td className="py-3 text-right">${idea.cpc.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "gap" && (
        <div className="card space-y-4">
          <p className="text-sm text-surface-500">Find keywords your competitors rank for, but you don't.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="input flex-1" 
              placeholder="comp1.com, comp2.com" 
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSubmittedCompetitors(competitors)}
            />
            <button className="btn btn-primary" onClick={() => setSubmittedCompetitors(competitors)}>
              <Search className="h-4 w-4" /> Find Gaps
            </button>
          </div>

          {gapQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600 my-8" />}

          {gapQuery.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-500">
                    <th className="py-2 font-medium">Keyword</th>
                    <th className="py-2 font-medium text-right">Volume</th>
                    <th className="py-2 font-medium text-right">Target Rank</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gapQuery.data.map((gap, idx) => (
                    <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-3 font-medium text-surface-900">{gap.keyword}</td>
                      <td className="py-3 text-right">{gap.searchVolume.toLocaleString()}</td>
                      <td className="py-3 text-right">{gap.targetRank || "-"}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          gap.status === 'missing' ? 'bg-red-100 text-red-700' :
                          gap.status === 'weak' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {gap.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "clusters" && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-surface-900">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Topic Clustering
                </h3>
                <p className="text-sm text-surface-500 mb-4">
                  Paste a list of keywords (comma separated) and Gemini AI will automatically group them into semantic pillar topics.
                </p>
                <textarea 
                  className="input w-full h-24 mb-4" 
                  placeholder="seo tools, rank tracker, keyword research, backlink checker, on page seo..."
                  value={clusterInput}
                  onChange={(e) => setClusterInput(e.target.value)}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleGenerateClusters}
                  disabled={generateClusterMutation.isPending || !clusterInput}
                >
                  {generateClusterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  Generate Content Pillars
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clustersQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600 my-8 col-span-2" />}
            
            {clustersQuery.data?.map((cluster) => (
              <div key={cluster._id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-surface-900 capitalize">{cluster.pillarTopic}</h4>
                  <span className="text-xs font-medium bg-surface-100 px-2 py-1 rounded text-surface-600">
                    Vol: {cluster.overallVolume.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {cluster.subTopics.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-surface-50 rounded border border-surface-100">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-surface-400" />
                        <span className="font-medium text-surface-700">{sub.keyword}</span>
                        {renderIntentBadge(sub.intent)}
                      </div>
                      <div className="text-surface-500">
                        {sub.searchVolume.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "visibility" && visibilityQuery.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Visibility Score</p>
                <p className="text-xl font-bold text-surface-900">{visibilityQuery.data.visibilityScore.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Share of Voice</p>
                <p className="text-xl font-bold text-surface-900">{visibilityQuery.data.shareOfVoice}%</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Top 3 Rankings</p>
                <p className="text-xl font-bold text-surface-900">{visibilityQuery.data.keywordsInTop3}</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Top 10 Rankings</p>
                <p className="text-xl font-bold text-surface-900">{visibilityQuery.data.keywordsInTop10}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">How Visibility is Calculated</h3>
            <p className="text-sm text-surface-600">
              Your <strong>Visibility Score</strong> is a measure of how often your site is seen in search results. It is calculated by taking the Search Volume of a keyword and multiplying it by the estimated Click-Through Rate (CTR) for your current ranking position.
            </p>
            <p className="text-sm text-surface-600 mt-2">
              <strong>Share of Voice (SOV)</strong> compares your visibility score to the theoretical maximum visibility (if you ranked #1 for every tracked keyword).
            </p>
            <div className="mt-4 p-4 bg-surface-50 rounded-lg text-sm font-mono text-surface-800">
              Visibility Score = Σ (keyword_volume × estimated_ctr_at_position)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
