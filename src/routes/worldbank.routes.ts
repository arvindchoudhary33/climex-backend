import express from "express";
import axios from "axios";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

const WORLDBANK_API = "https://search.worldbank.org/api/v2/wds";

// @ts-ignore
router.get("/search", auth, async (req, res) => {
  try {
    const queryParams = new URLSearchParams(
      req.query as Record<string, string>,
    );

    if (!queryParams.has("format")) {
      queryParams.append("format", "json");
    }

    const url = `${WORLDBANK_API}?${queryParams.toString()}`;

    console.log("Requesting World Bank API:", url); // Debug log

    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ClimateApp/1.0;)",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("World Bank API error:", error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;
      res.status(statusCode).json({
        error: true,
        message: errorMessage,
        details: error.response?.data,
      });
    } else {
      res.status(500).json({
        error: true,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
});

export default router;
