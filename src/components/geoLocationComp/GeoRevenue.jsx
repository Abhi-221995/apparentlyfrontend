import React, { useEffect, useState } from "react";
import axios from "axios";

const GeoRevenue = () => {
  const accessToken = "ebb5cd6d-b40d-45ea-9aa3-512c523b9b3c";
  const date = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Helper function to sanitize data and remove circular references
  const sanitizeData = (data) => {
    try {
      // Use JSON.parse/stringify to remove circular references
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error("Error sanitizing data:", error);
      // Fallback: manually remove problematic properties
      if (Array.isArray(data)) {
        return data.map((item) => {
          if (typeof item === "object" && item !== null) {
            const clean = {};
            for (const [key, value] of Object.entries(item)) {
              if (typeof value !== "function" && !(value instanceof Element)) {
                clean[key] = value;
              }
            }
            return clean;
          }
          return item;
        });
      }
      return data;
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `/api/geo?accessToken=${accessToken}&startDate=${encodeURIComponent(
          dateStr
        )}`
      );
      // Sanitize the data before setting it in state
      const cleanData = sanitizeData(response.data);
      setData(cleanData); // Assuming the API returns the data as an array
    } catch (err) {
      const msg = err?.message || "Error fetching data";
      setError(msg);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, dateStr]);

  const tableWrapper = (children) => (
    <div className="hourly-page">
      <div className="hourly-card">
        <div className="hourly-card-header">
          <h2 className="hourly-title">Realtime Channel Analytics</h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="hourly-meta">Date: {dateStr}</span>
            {Array.isArray(data) && (
              <span className="hourly-meta" style={{ marginLeft: "12px" }}>
                Rows: {data.length}
              </span>
            )}
          </div>
        </div>
        <div className="hourly-table-container">{children}</div>
      </div>
    </div>
  );

  const renderTable = () => {
    if (!data) return null;

    if (Array.isArray(data)) {
      if (data.length === 0)
        return tableWrapper(<div style={{ padding: "16px" }}>No data</div>);
      const firstRow = data[0];
      if (
        firstRow &&
        typeof firstRow === "object" &&
        !Array.isArray(firstRow)
      ) {
        const columns = Array.from(
          new Set(data.flatMap((row) => Object.keys(row)))
        );
        return tableWrapper(
          <table className="hourly-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col}>
                      {typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
      return tableWrapper(
        <table className="hourly-table">
          <thead>
            <tr>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v, i) => (
              <tr key={i}>
                <td>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (typeof data === "object") {
      const entries = Object.entries(data);
      return tableWrapper(
        <table className="hourly-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>
                  {typeof v === "object"
                    ? JSON.stringify(v, null, 2)
                    : String(v)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return tableWrapper(<div style={{ padding: "16px" }}>{String(data)}</div>);
  };

  return (
    <div>
      {error && <div className="hourly-error">{error}</div>}
      {!error &&
        (data ? (
          renderTable()
        ) : (
          <div className="hourly-loading">Loading...</div>
        ))}
    </div>
  );
};

export default GeoRevenue;
