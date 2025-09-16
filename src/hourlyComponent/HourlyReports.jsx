import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import "./hourlyReports.css";

// Placeholder component for where a real chart would go
const ChartComponent = ({ chartType, data }) => {
  if (!data || data.labels.length === 0) {
    return <div className="chart-placeholder">No data to display in chart.</div>;
  }
  return (
    <div className={`chart-placeholder ${chartType}`}>
      <p>
        **{chartType.toUpperCase()} Visualization Placeholder**
      </p>
      <ul>
        {data.labels.map((label, index) => (
          <li key={label}>
            {label}: ${data.datasets[0].data[index].toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

function HourlyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("all"); // New state for agency filter

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 8 Ads by Estimated Earnings',
      },
    },
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    try {
      const response = await axios.get("https://apparentlybackends.onrender.com/revenue", {
        signal: controller.signal,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setData(rows);
      try {
        localStorage.setItem("hourlyReports", JSON.stringify(rows));
      } catch (storageErr) {
        console.warn(
          "Failed to persist hourly reports to localStorage",
          storageErr
        );
      }
    } catch (err) {
      if (axios.isCancel?.(err)) return;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch reports";
      setError(message);
      try {
        const cached = localStorage.getItem("hourlyReports");
        if (cached) setData(JSON.parse(cached));
      } catch (readErr) {
        console.warn("Failed to read cached hourly reports", readErr);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rows = Array.isArray(data) ? data : [];

  // Function to convert AGID to agency name
  const getAgencyName = (agid) => {
    const agidStr = String(agid);
    if (agidStr === "6864116138") return "Travado";
    if (agidStr === "8177198441") return "EveryKnown";
    return agidStr; // Return original AGID if not matching
  };

  const getRowDate = (row) => {
    const raw =
      // row?.DATE_UPLOADED_PST ??
      // row?.DATE_UPLOADED ??
      row?.createdAt ??
      row?.updatedAt;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const { minDateStr, maxDateStr } = useMemo(() => {
    const times = rows
      .map(getRowDate)
      .filter(Boolean)
      .map((d) => d.getTime());
    if (!times.length) return { minDateStr: "", maxDateStr: "" };
    const minD = new Date(Math.min(...times));
    const maxD = new Date(Math.max(...times));
    const toYMD = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    return { minDateStr: toYMD(minD), maxDateStr: toYMD(maxD) };
  }, [rows]);

  const fromBound = useMemo(() => {
    if (!fromDate) return null;
    const d = new Date(fromDate + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [fromDate]);

  const toBound = useMemo(() => {
    if (!toDate) return null;
    const d = new Date(toDate + "T23:59:59.999");
    return isNaN(d.getTime()) ? null : d;
  }, [toDate]);

  const withinRange = (d) => {
    if (!d) return true;
    if (fromBound && d < fromBound) return false;
    if (toBound && d > toBound) return false;
    return true;
  };

  // Filter by date and agency
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Date filter
      if (!withinRange(getRowDate(r))) return false;
      
      // Agency filter
      if (selectedAgency !== "all") {
        const agidStr = String(r?.AGID);
        if (selectedAgency === "travado" && agidStr !== "6864116138") return false;
        if (selectedAgency === "everyknown" && agidStr !== "8177198441") return false;
      }
      
      return true;
    });
  }, [rows, fromBound, toBound, selectedAgency]);

  const fieldsToSum = new Set([
    "ESTIMATED_EARNINGS",
    "AD_REQUESTS",
    "MATCHED_AD_REQUESTS",
    "IMPRESSIONS",
    "INDIVIDUAL_AD_IMPRESSIONS",
    "CLICKS",
    "ESTIMATED_CLICKS",
  ]);

  // Aggregate by TKID but include agency information
  const aggregatedRows = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const key = row?.TKID ?? "__UNKNOWN_TKID__";
        if (!acc.map.has(key)) {
          const base = { ...row };
          // Convert AGID to agency name
          base.AGENCY = getAgencyName(base.AGID);
          fieldsToSum.forEach((f) => {
            base[f] = Number.isFinite(base[f]) ? Number(base[f]) : 0;
          });
          acc.map.set(key, base);
          acc.list.push(base);
        } else {
          const target = acc.map.get(key);
          fieldsToSum.forEach((f) => {
            const v = Number(row?.[f]);
            if (Number.isFinite(v)) target[f] += v;
          });
          // Update agency name if needed (in case of mixed data)
          target.AGENCY = getAgencyName(row.AGID);
          Object.keys(row || {}).forEach((k) => {
            if (!fieldsToSum.has(k) && target[k] === undefined) {
              target[k] = row[k];
            }
          });
        }
        return acc;
      },
      { map: new Map(), list: [] }
    ).list;
  }, [filteredRows]);

  const excludedColumns = new Set([
    "FUNNEL_REQUESTS",
    "FUNNEL_IMPRESSIONS",
    "DATE_UPLOADED",
    "__v",
    "createdAt",
    "updatedAt",
    "recordId",
    "PAGE_VIEWS",
    "FUNNEL_CLICKS",
    "_id",
    "DATE"
  ]);

  const columnAliases = {
    TKID: "Site ID",
    AGID: "Agency ID", 
    AGENCY: "Agency", // New column for agency name
    ESTIMATED_EARNINGS: "Est. Earnings",
    AD_REQUESTS: "Ad Requests",
    MATCHED_AD_REQUESTS: "Matched Requests",
    IMPRESSIONS: "Impressions",
    INDIVIDUAL_AD_IMPRESSIONS: "Ad Impressions",
    CLICKS: "Clicks",
    ESTIMATED_CLICKS: "Est. Clicks",
  };

  const columns =
    aggregatedRows.length > 0 ? Object.keys(aggregatedRows[0]) : [];
  const visibleColumns = columns.filter((col) => !excludedColumns.has(col));

  const topRows = useMemo(() => {
    return [...aggregatedRows]
      .sort((a, b) => (b.ESTIMATED_EARNINGS || 0) - (a.ESTIMATED_EARNINGS || 0))
      .slice(0, 8);
  }, [aggregatedRows]);

  // Function to structure data for a charting library (like Chart.js)
  const getChartData = useMemo(() => {
    const labels = topRows.map(row => `${row.TKID} (${row.AGENCY})`);
    const earnings = topRows.map(row => row.ESTIMATED_EARNINGS || 0);
    
    return {
      labels: labels,
      datasets: [
        {
          label: 'Estimated Earnings ($)',
          data: earnings,
          backgroundColor: [
            '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#7E57C2', '#26A69A', '#D4E157', '#FF8A65'
          ],
          hoverBackgroundColor: [
            '#64B5F6', '#81C784', '#FFB74D', '#E57373', '#9575CD', '#4DB6AC', '#C5E1A5', '#FFCCBC'
          ],
          borderColor: 'rgba(0,0,0,0.1)',
          borderWidth: 1,
        },
      ],
    };
  }, [topRows]);

  // Calculate totals by agency
  const agencyTotals = useMemo(() => {
    return aggregatedRows.reduce((acc, row) => {
      const agency = row.AGENCY || 'Unknown';
      if (!acc[agency]) {
        acc[agency] = {
          earnings: 0,
          clicks: 0,
          estimatedClicks: 0,
          sites: 0
        };
      }
      acc[agency].earnings += row.ESTIMATED_EARNINGS || 0;
      acc[agency].clicks += row.CLICKS || 0;
      acc[agency].estimatedClicks += row.ESTIMATED_CLICKS || 0;
      acc[agency].sites += 1;
      return acc;
    }, {});
  }, [aggregatedRows]);

  const totalEstimatedEarnings = aggregatedRows.reduce(
    (acc, r) =>
      acc + (Number.isFinite(r.ESTIMATED_EARNINGS) ? r.ESTIMATED_EARNINGS : 0),
    0
  );
  const totalClicks = aggregatedRows.reduce(
    (acc, r) => acc + (Number.isFinite(r.CLICKS) ? r.CLICKS : 0),
    0
  );
  const totalEstimatedClicks = aggregatedRows.reduce(
    (acc, r) =>
      acc + (Number.isFinite(r.ESTIMATED_CLICKS) ? r.ESTIMATED_CLICKS : 0),
    0
  );

  const fmtMoney = (n) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00");
  const fmtNumber = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

  return (
    <div className="mainContainer">
      <div className="reports-page">
        <h1 className="reports-title">EveryKnown & Travado Dashboard 📈</h1>

        {/* Controls and Metadata */}
        <div className="reports-controls">
          <button
            className="reports-button"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh Data"}
          </button>

          <div className="reports-filters">
            <label className="reports-filter">
              Agency:&nbsp;
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
              >
                <option value="all">All Agencies</option>
                <option value="travado">Travado</option>
                <option value="everyknown">EveryKnown</option>
              </select>
            </label>
            
            <label className="reports-filter">
              From:&nbsp;
              <input
                type="date"
                value={fromDate}
                min={minDateStr || undefined}
                max={toDate || maxDateStr || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label className="reports-filter">
              To:&nbsp;
              <input
                type="date"
                value={toDate}
                min={fromDate || minDateStr || undefined}
                max={maxDateStr || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
            <button
              className="reports-button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setSelectedAgency("all");
              }}
            >
              Clear All Filters
            </button>
          </div>

          {error && <span className="reports-error">{error}</span>}
          <div className="reports-metadata-group">
            <span className="reports-meta">Total Rows: {fmtNumber(rows.length)}</span>
            <span className="reports-meta">Filtered Rows: {fmtNumber(filteredRows.length)}</span>
            <span className="reports-meta">Aggregated Sites: {fmtNumber(aggregatedRows.length)}</span>
          </div>
        </div>

        {loading && <div className="reports-loading">Loading reports…</div>}
        {!loading && aggregatedRows.length === 0 && (
          <div className="reports-empty">No reports found for the selected filter.</div>
        )}

        {/* Dashboard View */}
        {!loading && aggregatedRows.length > 0 && (
          <>
            <div className="dashboard-grid">
              {/* Total Summary Cards (KPIs) */}
              <div className="total-summary card-kpi">
                <h3>Total Est. Earnings</h3>
                <p className="kpi-value">{fmtMoney(totalEstimatedEarnings)}</p>
              </div>
              <div className="total-summary card-kpi">
                <h3>Total Clicks</h3>
                <p className="kpi-value">{fmtNumber(totalClicks)}</p>
              </div>
              <div className="total-summary card-kpi">
                <h3>Total Est. Clicks</h3>
                <p className="kpi-value">{fmtNumber(totalEstimatedClicks)}</p>
              </div>
            </div>

            {/* Agency Breakdown */}
            {/* {Object.keys(agencyTotals).length > 1 && (
              <div className="agency-breakdown">
                <h2>Agency Performance Breakdown 🏢</h2>
                <div className="agency-cards">
                  {Object.entries(agencyTotals).map(([agency, totals]) => (
                    <div key={agency} className="agency-card">
                      <h3>{agency}</h3>
                      <div className="agency-stats">
                        <p><strong>Earnings:</strong> {fmtMoney(totals.earnings)}</p>
                        <p><strong>Clicks:</strong> {fmtNumber(totals.clicks)}</p>
                        <p><strong>Sites:</strong> {fmtNumber(totals.sites)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
             */}
            <div className="dashboard-charts">
              <div className="chart-container-graph">
                <h2>Top 8 Ads by Estimated Earnings 💰</h2>
                <Bar options={options} data={getChartData} />
              </div>
              
              <div className="chart-container">
                <h2>Raw Data Leaderboard 🥇</h2>
                <ul className="top-rows-list">
                  {topRows.map((row) => (
                    <li key={row.TKID}>
                        <strong>{row.TKID}</strong> ({row.AGENCY}): {fmtMoney(row.ESTIMATED_EARNINGS)} ({fmtNumber(row.CLICKS)} Clicks)
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="table-heading">Detailed Aggregated Data</h2>

            {/* Data Table */}
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col}>{columnAliases[col] ?? col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aggregatedRows.map((r, i) => (
                    <tr key={i}>
                      {visibleColumns.map((col) => (
                        <td key={col}>
                          {col === "ESTIMATED_EARNINGS" ? fmtMoney(r[col]) :
                           col === "CLICKS" || col === "ESTIMATED_CLICKS" || col === "AD_REQUESTS" || col === "MATCHED_AD_REQUESTS" || col === "IMPRESSIONS" || col === "INDIVIDUAL_AD_IMPRESSIONS" ? fmtNumber(r[col]) :
                           typeof r[col] === "object"
                            ? JSON.stringify(r[col])
                            : String(r[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HourlyReport;