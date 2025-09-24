import axios from "axios";
import { useEffect, useState } from "react";
import "./hourly.css";

function Hourly() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [searchTkid, setSearchTkid] = useState("");
  const [filteredData, setFilteredData] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://apparentlydigitalbackend.onrender.com/revenue"
      );

      const formattedData = response.data.map((row) => {
        const newRow = {};
        for (const key in row) {
          if (Object.prototype.hasOwnProperty.call(row, key)) {
            newRow[key.toLowerCase()] = row[key];
          }
        }
        return newRow;
      });

      setData(formattedData);
      setLastFetchTime(new Date());
      setFilteredData(formattedData);
      aggregateData(formattedData);
    } catch (err) {
      setError(err?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!data) return;
    if (searchTkid === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) =>
        String(row.tkid).includes(searchTkid)
      );
      setFilteredData(filtered);
    }
  };

  const aggregateData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
      setAggregatedData([]);
      return;
    }

    const aggregated = rawData.reduce((acc, current) => {
      const { tkid, estimated_earnings, clicks } = current;
      if (!acc[tkid]) {
        acc[tkid] = {
          tkid,
          estimated_earnings: 0,
          clicks: 0,
          rpc: 0,
        };
      }
      acc[tkid].estimated_earnings += parseFloat(estimated_earnings || 0);
      acc[tkid].clicks += parseInt(clicks || 0, 10);
      return acc;
    }, {});

    const finalAggregated = Object.values(aggregated).map((row) => {
      const rpc = row.clicks > 0 ? row.estimated_earnings / row.clicks : 0;
      return {
        ...row,
        rpc: `$${rpc.toFixed(2)}`,
        estimated_earnings: `$${row.estimated_earnings.toFixed(2)}`,
      };
    });

    setAggregatedData(finalAggregated);
  };

  useEffect(() => {
    fetchData();
    const fetchInterval = setInterval(fetchData, 3600000);
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTkid, data]);

  const renderTable = (dataToRender, isAggregated = false) => {
    if (!dataToRender || dataToRender.length === 0)
      return <div style={{ padding: "16px" }}>No data</div>;

    let columns;
    if (isAggregated) {
      columns = ["tkid", "estimated_earnings", "clicks", "rpc"];
    } else {
      columns = [
        "tkid",
        "agid",
        "estimated_earnings",
        "page_views",
        "impressions",
        "clicks",
        "estimated_clicks",
        "platform_type_code",
        "date_uploaded",
        "date_uploaded_pst",
      ];
    }

    return (
      <table className="hourly-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col.replace(/_/g, " ").toUpperCase()}</th>
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
            {Array.isArray(filteredData) && (
              <span className="hourly-meta">Rows: {filteredData.length}</span>
            )}
            {lastFetchTime && (
              <span className="hourly-meta">
                Last Updated:{" "}
                {lastFetchTime.toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            )}
          </div>
        </div>
        <div className="hourly-table-container">
          {error && <div className="hourly-error">{error}</div>}
          {loading && <div className="hourly-loading">Loading...</div>}
          {!error && !loading && renderTable(filteredData)}
        </div>
      </div>

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