import express from "express";
import axios from "axios";
import { Request, Response } from "express";

const router = express.Router();

const WORLDBANK_API = "https://search.worldbank.org/api/v2/wds";
const NCDC_API = "https://www.ncdc.noaa.gov/cdo-web/api/v2";

router.get("/documents", async (req: Request, res: Response) => {
  try {
    const { topic = "climate change", region, startYear, endYear } = req.query;

    const queryParams = new URLSearchParams({
      format: "json",
      qterm: `${topic} AND risk`,
      rows: "10",
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

    const response = await axios.get(
      `${WORLDBANK_API}?${queryParams.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("World Bank API error:", error);
    res.status(500).json({ error: "Failed to fetch climate documents" });
  }
});

// @ts-ignore
router.get("/temperature", async (req: Request, res: Response) => {
  try {
    const { startdate, enddate, locationId, datatypeid = "TAVG" } = req.query;

    if (!startdate || !enddate || !locationId) {
      return res.status(400).json({
        error:
          "Missing required parameters. Please provide startdate, enddate, and locationId",
      });
    }

    const start = new Date(startdate as string);
    const end = new Date(enddate as string);
    const today = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format. Please use YYYY-MM-DD format",
      });
    }

    if (end > today) {
      return res.status(400).json({
        error: "End date cannot be in the future",
      });
    }

    const response = await axios.get(`${NCDC_API}/data`, {
      params: {
        datasetid: "GHCND",
        datatypeid: datatypeid,
        locationid: locationId,
        startdate: startdate,
        enddate: enddate,
        units: "metric",
        limit: 1000,
      },
      headers: {
        token: process.env.NCDC_API_KEY,
      },
    });

    console.log("response", response.data);
    if (!response.data?.results?.length) {
      return res.json({
        results: [],
        message: "No data available for the specified criteria",
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error("NCDC API error:", error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message;
      res.status(statusCode).json({
        error: "Failed to fetch temperature data",
        details: errorMessage,
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch temperature data",
        details: "An unexpected error occurred",
      });
    }
  }
});
router.get("/overview", async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const { region } = req.query;
    const currentYear = new Date().getFullYear();

    const documentsResponse = await axios.get(
      `${WORLDBANK_API}?${new URLSearchParams({
        format: "json",
        qterm: "climate change AND risk",
        rows: "100",
        strdate: `${currentYear - 2}-01-01`,
      })}`,
    );

    res.json({
      documents: documentsResponse.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Overview data error:", error);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
});

export default router;
