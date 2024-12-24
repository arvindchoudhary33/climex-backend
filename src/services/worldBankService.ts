const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface SearchParams {
  page?: number;
  pageSize?: number;
  topic?: string;
  startYear?: number;
  endYear?: number;
  region?: string;
}

class WorldBankService {
  private async fetchData(params: Record<string, string>) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(
        `${API_URL}/api/v1/worldbank/search?${queryString}`,
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching World Bank data:", error);
      throw error;
    }
  }

  async getClimateDocuments({
    page = 1,
    pageSize = 10,
    topic,
    startYear,
    endYear,
    region,
  }: SearchParams = {}) {
    const queryParams: Record<string, string> = {
      format: "json",
      qterm: topic ? `climate change AND ${topic}` : "climate change AND risk",
      rows: pageSize.toString(),
      os: ((page - 1) * pageSize).toString(),
    };

    if (startYear) {
      queryParams.strdate = `${startYear}-01-01`;
    }

    if (endYear) {
      queryParams.enddate = `${endYear}-12-31`;
    }

    if (region) {
      queryParams.admreg = region;
    }

    return this.fetchData(queryParams);
  }

  async searchDocuments(
    searchTerm: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    return this.fetchData({
      format: "json",
      qterm: searchTerm,
      rows: pageSize.toString(),
      os: ((page - 1) * pageSize).toString(),
    });
  }
}

export const worldBankService = new WorldBankService();
