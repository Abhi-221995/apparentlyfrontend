import axios from "axios";
import { useEffect, useState } from "react";
import "./hourly.css";


function Hourly() {
  const accessToken = "ebb5cd6d-b40d-45ea-9aa3-512c523b9b3c";

  const [selectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [searchTkid, setSearchTkid] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null);

  const fetchData = async (dateToFetch) => {
    setLoading(true);
    setError(null);
    try {
      const date = new Date();
      const dateStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).format(date);

      const response = await axios.get(
        `/api/proxy?accessToken=${accessToken}&startDate=${encodeURIComponent(
          dateStr
        )}`
      );
      setData(response.data);
      setLastFetchTime(new Date());
      setFilteredData(response.data);
      aggregateData(response.data); // Call the aggregation function
    } catch (err) {
      setError(err?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (dataToSave, dateToSave) => {
    if (!dataToSave) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const payload = Array.isArray(dataToSave) ? dataToSave : [dataToSave];
      await axios.post("http://localhost:3000/revenues", {
        date: dateToSave,
        rows: payload,
      });
      setSaveMessage("Saved successfully");
      setLastSaveTime(new Date());
    } catch (e) {
      setSaveMessage(e?.response?.data?.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = () => {
    if (!data) return;
    if (searchTkid === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) =>
        String(row.TKID).includes(searchTkid)
      );
      setFilteredData(filtered);
    }
  };

  /**
   * Aggregates data by TKID and calculates RPC.
   * @param {Array} rawData The raw data to be aggregated.
   */
  const aggregateData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
      setAggregatedData([]);
      return;
    }

    const aggregated = rawData.reduce((acc, current) => {
      const { TKID, ESTIMATED_EARNINGS, CLICKS } = current;
      if (!acc[TKID]) {
        acc[TKID] = {
          TKID,
          ESTIMATED_EARNINGS: 0,
          CLICKS: 0,
          RPC: 0,
        };
      }
      acc[TKID].ESTIMATED_EARNINGS += parseFloat(ESTIMATED_EARNINGS || 0);
      acc[TKID].CLICKS += parseInt(CLICKS || 0, 10);
      return acc;
    }, {});

    const finalAggregated = Object.values(aggregated).map((row) => {
      const rpc = row.CLICKS > 0 ? row.ESTIMATED_EARNINGS / row.CLICKS : 0;
      return {
        ...row,
        RPC: `$${rpc.toFixed(2)}`,
        ESTIMATED_EARNINGS: `$${row.ESTIMATED_EARNINGS.toFixed(2)}`,
      };
    });

    setAggregatedData(finalAggregated);
  };

  useEffect(() => {
    fetchData(selectedDate);
    const fetchInterval = setInterval(() => fetchData(selectedDate), 3600000);
    return () => clearInterval(fetchInterval);
  }, [selectedDate]);

  useEffect(() => {
    handleSearch();
  }, [searchTkid, data]);

  const renderTable = (dataToRender, isAggregated = false) => {
    if (!dataToRender || dataToRender.length === 0)
      return <div style={{ padding: "16px" }}>No data</div>;

    const columns = isAggregated
      ? ["TKID", "ESTIMATED_EARNINGS", "CLICKS", "RPC"]
      : Array.from(new Set(dataToRender.flatMap((row) => Object.keys(row))));

    return (
      <table className="hourly-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataToRender.map((row, idx) => (
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
  };

  return (
    <div className="hourly-page">
      {/* First Card (Original Code) */}
      <div className="hourly-card">
        <div className="hourly-card-header">
          <h2 className="hourly-title">Realtime Channel Analytics</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="text"
              placeholder="Search by TKID"
              value={searchTkid}
              onChange={(e) => setSearchTkid(e.target.value)}
              className="hourly-search-input"
            />
            <button onClick={handleSearch} className="hourly-save-button">
              Search
            </button>
            <span className="hourly-meta">
              Date:{" "}
              {new Date().toLocaleString("en-US", {
                timeZone: "America/Los_Angeles",
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
            {Array.isArray(filteredData) && (
              <span className="hourly-meta">Rows: {filteredData.length}</span>
            )}
            {lastFetchTime && (
              <span className="hourly-meta">
                Last Fetch:{" "}
                {lastFetchTime.toLocaleString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            )}
            {lastSaveTime && (
              <span className="hourly-meta">
                Last Save:{" "}
                {lastSaveTime.toLocaleString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            )}
            {data && (
              <button
                onClick={() =>
                  handleSave(
                    data,
                    new Date(selectedDate + "T00:00:00").toLocaleString("en-US", {
                      timeZone: "America/Los_Angeles",
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                  )
                }
                disabled={isSaving}
                className="hourly-save-button"
              >
                {isSaving ? "Saving…" : "Save to API"}
              </button>
            )}
            {saveMessage && (
              <span className="hourly-meta">{saveMessage}</span>
            )}
          </div>
        </div>
        <div className="hourly-table-container">
          {error && <div className="hourly-error">{error}</div>}
          {!error &&
            (data ? (
              renderTable(filteredData)
            ) : (
              <div className="hourly-loading">Loading...</div>
            ))}
        </div>
      </div>

      {/* Second Card (Aggregated Data) */}
      <div className="aggregated-card">
        <div className="aggregated-card-header">
          <h2 className="aggregated-title">Aggregated Analytics by TKID</h2>
        </div>
        <div className="aggregated-table-container">
          {aggregatedData ? (
            renderTable(aggregatedData, true)
          ) : (
            <div className="aggregated-loading">Aggregating data...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hourly;