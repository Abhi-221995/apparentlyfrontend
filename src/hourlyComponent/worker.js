// worker.js
import axios from "axios";

const accessToken = "ebb5cd6d-b40d-45ea-9aa3-512c523b9b3c";

// Helper function to sanitize data and remove circular references
const sanitizeData = (data) => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error sanitizing data in worker:", error);
    return data;
  }
};

// Fetch data from API
const fetchData = async (dateStr) => {
  try {
    self.postMessage({ type: "fetchStarted" });
    const response = await axios.get(
      `api/proxy?accessToken=${accessToken}&startDate=${encodeURIComponent(
        dateStr
      )}`
    );
    const cleanData = sanitizeData(response.data);
    return cleanData;
  } catch (err) {
    const msg = err?.message || "Error fetching data in worker";
    self.postMessage({ type: "error", payload: { message: msg } });
    return null;
  }
};

// Handle saving data to MongoDB
const handleSave = async (payload) => {
  if (!payload) return;

  try {
    const rawPayload = Array.isArray(payload) ? payload : [payload];
    const cleanPayload = sanitizeData(rawPayload);

    if (Array.isArray(cleanPayload) && cleanPayload.length > 100) {
      const batchSize = 100;
      const totalBatches = Math.ceil(cleanPayload.length / batchSize);
      let insertedTotal = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batch = cleanPayload.slice(start, end);
        try {
          const resp = await axios.post(
            "http://localhost:3003/revenues",
            batch,
            { headers: { "Content-Type": "application/json" } }
          );
          insertedTotal += resp?.data?.insertedCount || 0;
          self.postMessage({
            type: "saveProgress",
            payload: {
              message: `Saved batch ${
                i + 1
              }/${totalBatches} (total saved: ${insertedTotal})`,
            },
          });
        } catch (batchErr) {
          console.error(`Batch ${i + 1} failed in worker:`, batchErr);
          const msg =
            batchErr?.response?.data?.message || `Batch ${i + 1} failed`;
          self.postMessage({ type: "error", payload: { message: msg } });
          return;
        }
      }
      self.postMessage({
        type: "saveCompleted",
        payload: {
          message: `Saved ${insertedTotal} records in ${totalBatches} batches`,
        },
      });
    } else {
      const response = await axios.post(
        "http://localhost:3003/revenues",
        cleanPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      self.postMessage({
        type: "saveCompleted",
        payload: { message: response?.data?.message || "Saved successfully" },
      });
    }
  } catch (e) {
    console.error("Save error in worker:", e);
    const msg = e?.response?.data?.message || "Failed to save";
    self.postMessage({ type: "error", payload: { message: msg } });
  }
};

const runFetchAndSave = async () => {
  const date = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);

  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  self.postMessage({
    type: "intervalTriggered",
    payload: { nextInterval: nextHour.getTime() },
  });

  const freshData = await fetchData(dateStr);
  if (freshData) {
    self.postMessage({ type: "fetchCompleted", payload: freshData });
    await handleSave(freshData);
  }
};

let intervalId;

self.onmessage = async function (e) {
  if (e.data === "start") {
    // Schedule the first run at the next top of the hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours(), 0, 0, 0); // Align to the current hour
    if (now.getMinutes() > 0 || now.getSeconds() > 0) {
      nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Or the next hour
    } else {
      runFetchAndSave(); // Run immediately if it's the top of the hour
    }

    const delay = nextHour.getTime() - now.getTime();

    setTimeout(() => {
      runFetchAndSave();
      // Set up the hourly interval after the first run
      intervalId = setInterval(runFetchAndSave, 60 * 60 * 1000); // 1 hour
    }, delay);
  } else if (e.data === "triggerNow") {
    await runFetchAndSave();
  } else if (e.data === "stop") {
    clearInterval(intervalId);
  }
};
