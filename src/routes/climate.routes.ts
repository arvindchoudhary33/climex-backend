import express from "express";
import axios from "axios";
import { Request, Response } from "express";

const router = express.Router();

const WORLDBANK_API = "https://search.worldbank.org/api/v2/wds";
const NCDC_API = "https://www.ncdc.noaa.gov/cdo-web/api/v2";

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const isValidDate = (date: string) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

router.get("/documents", async (req: Request, res: Response) => {
  try {
    const { topic = "climate change", region, startYear, endYear } = req.query;

    console.log("Fetching documents with params:", {
      topic,
      region,
      startYear,
      endYear,
    });

    const queryParams = new URLSearchParams({
      format: "json",
      qterm: `${topic}`,
      rows: "50",
      order: "desc",
      srt: "docdt",
    });

    if (region) {
      queryParams.append("admreg_exact", region as string);
    }

    if (startYear) {
      queryParams.append("strdate", `${startYear}-01-01`);
    }

    if (endYear) {
      queryParams.append("enddate", `${endYear}-12-31`);
    }

    const url = `${WORLDBANK_API}?${queryParams.toString()}`;
    console.log("Making request to:", url);

    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
      },
    });

    res.json({
      documents: response.data.documents || {},
      total: response.data.total || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("World Bank API error:", error);
    res.status(500).json({
      error: "Failed to fetch climate documents",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// @ts-ignore
router.get("/temperature", async (req: Request, res: Response) => {
  try {
    const { startdate, enddate, locationId, datatypeid = "TMAX" } = req.query;

    if (!startdate || !enddate || !locationId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "Please provide startdate, enddate, and locationId",
      });
    }

    if (!isValidDate(startdate as string) || !isValidDate(enddate as string)) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Please use YYYY-MM-DD format",
      });
    }

    const start = new Date(startdate as string);
    const end = new Date(enddate as string);
    const today = new Date();

    if (end > today) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "End date cannot be in the future",
      });
    }

    const dateDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
    );

    if (dateDiff > 365) {
      const chunks = [];
      let currentStart = new Date(start);

      while (currentStart < end) {
        let currentEnd = new Date(currentStart);
        currentEnd.setFullYear(currentStart.getFullYear() + 1);

        if (currentEnd > end) {
          currentEnd = end;
        }

        chunks.push({
          start: formatDate(currentStart),
          end: formatDate(currentEnd),
        });

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
      }

      const results = await Promise.all(
        chunks.map((chunk) =>
          axios.get(`${NCDC_API}/data`, {
            params: {
              datasetid: "GHCND",
              datatypeid,
              locationid: locationId,
              startdate: chunk.start,
              enddate: chunk.end,
              units: "metric",
              limit: 1000,
            },
            headers: {
              token: process.env.NCDC_API_KEY,
            },
          }),
        ),
      );

      // @ts-ignore
      const combinedResults = results.reduce((acc, response) => {
        if (response.data?.results) {
          return [...acc, ...response.data.results];
        }
        return acc;
      }, []);

      // @ts-ignore
      combinedResults.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // @ts-ignore
      if (!combinedResults.length) {
        return res.json({
          results: [],
          message: "No data available for the specified criteria",
        });
      }

      const transformedData = {
        // @ts-ignore
        results: combinedResults.map((item: any) => ({
          date: item.date,
          value: parseFloat(item.value),
          station: item.station,
          unit: "°C",
        })),
        metadata: {
          params: {
            locationId,
            datatypeid,
            startdate: formatDate(start),
            enddate: formatDate(end),
          },
        },
      };

      return res.json(transformedData);
    }

    const response = await axios.get(`${NCDC_API}/data`, {
      params: {
        datasetid: "GHCND",
        datatypeid,
        locationid: locationId,
        startdate: formatDate(start),
        enddate: formatDate(end),
        units: "metric",
        limit: 1000,
      },
      headers: {
        token: process.env.NCDC_API_KEY,
      },
    });

    if (!response.data?.results?.length) {
      return res.json({
        results: [],
        message: "No data available for the specified criteria",
      });
    }

    const transformedData = {
      results: response.data.results.map((item: any) => ({
        date: item.date,
        value: parseFloat(item.value),
        station: item.station,
        unit: "°C",
      })),
      metadata: {
        resultset: response.data.metadata,
        params: {
          locationId,
          datatypeid,
          startdate: formatDate(start),
          enddate: formatDate(end),
        },
      },
    };

    res.json(transformedData);
  } catch (error) {
    console.error("NCDC API error:", error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage =
        error.response?.data?.developerMessage ||
        error.response?.data?.userMessage ||
        error.message;

      if (statusCode === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: "Please try again later",
        });
      }

      res.status(statusCode).json({
        error: "Failed to fetch temperature data",
        message: errorMessage,
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch temperature data",
        message: "An unexpected error occurred",
      });
    }
  }
});
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const { region } = req.query;
    const currentYear = new Date().getFullYear();

    const queryParams = new URLSearchParams({
      format: "json",
      qterm: "climate change AND (economic OR economy OR financial OR market)",
      rows: "100",
      strdate: `${currentYear - 2}-01-01`,
      order: "desc",
      srt: "docdt",
    });

    if (region) {
      queryParams.append("admreg_exact", region as string);
    }

    const response = await axios.get(
      `${WORLDBANK_API}?${queryParams.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    res.json({
      documents: response.data.documents || {},
      total: response.data.total || 0,
      timestamp: new Date().toISOString(),
      metadata: {
        region,
        timeframe: `${currentYear - 2} to ${currentYear}`,
        queryParams: queryParams.toString(),
      },
    });
  } catch (error) {
    console.error("Overview data error:", error);
    res.status(500).json({
      error: "Failed to fetch overview data",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

export default router;
