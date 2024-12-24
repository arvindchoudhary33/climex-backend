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

router.get("/temperature", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const response = await axios.get(`${NCDC_API}/data`, {
      params: {
        datasetid: "GHCND",
        datatypeid: "TAVG",
        locationid: locationId,
        startdate: startDate,
        enddate: endDate,
        units: "metric",
        limit: 1000,
      },
      headers: {
        token: process.env.NCDC_API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("NCDC API error:", error);
    res.status(500).json({ error: "Failed to fetch temperature data" });
  }
});

router.get("/overview", async (req: Request, res: Response) => {
  try {
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
