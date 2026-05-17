import api from "./api";

export const exportApi = {
  async downloadKeywordsCsv(domain?: string) {
    const url = `/export/csv/keywords${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`;
    const response = await api.get(url, { responseType: "blob" });
    this.triggerDownload(response.data, `keywords_${domain || "all"}.csv`);
  },

  async downloadBacklinksCsv(domain?: string) {
    const url = `/export/csv/backlinks${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`;
    const response = await api.get(url, { responseType: "blob" });
    this.triggerDownload(response.data, `backlinks_${domain || "all"}.csv`);
  },

  triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
