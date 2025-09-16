# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


The context for this project revolves around creating a data pipeline to extract, store, and analyze performance data from Google Ads. The primary goal is to provide timely, actionable insights to optimize ad campaigns and maximize return on investment (ROI). This project will use MongoDB as the database to store the raw and processed data, taking advantage of its flexible schema and ability to handle large volumes of time-series data.

Project Context & Objectives
The digital advertising landscape requires continuous monitoring and rapid response to market changes. Manually extracting and analyzing data from Google Ads is time-consuming and often lags behind real-time performance. This project aims to automate this process to ensure data is always fresh and analysis is based on the most current information. The key objectives are:

Automated Data Extraction: Develop a script or application to pull key performance metrics from the Google Ads API, such as impressions, clicks, conversions, cost, and revenue.

Time-Series Data Storage: Store the extracted data in a MongoDB database with a structured approach for hourly and weekly aggregation. This will allow for granular analysis and the identification of performance trends over time. MongoDB's time-series collections are specifically designed for this purpose, providing optimized storage and query performance.

Data Analysis & Insights: Analyze the stored data to identify which ads, keywords, campaigns, and ad groups are performing well and which are underperforming. The analysis will focus on critical metrics like Return on Ad Spend (ROAS), Cost Per Acquisition (CPA), and Conversion Rate.

Actionable Reporting: Generate reports or visualizations that highlight top-performing ads and campaigns. These insights will empower marketing teams to make data-driven decisions, such as reallocating budgets to high-ROI ads or pausing ineffective ones.

Technical Components
Google Ads API: The primary source for all ad performance data. The project will use the Google Ads API to query and extract data based on specific date ranges and campaign segments.

Data Ingestion Layer: A script (e.g., Python) will be developed to connect to the API, handle authentication, and ingest the data into the database. This layer will be scheduled to run at specific intervals (e.g., hourly).

MongoDB Database: The non-relational database of choice due to its flexibility with evolving data schemas and its native support for time-series data, which is ideal for this type of project.

Data Transformation & Analysis: The data will be processed within the application or via MongoDB's aggregation pipeline to calculate key metrics and identify top performers. For example, a script could aggregate hourly data to create a weekly summary.

Reporting/Visualization: A front-end dashboard or a simple reporting tool could be built to display the results of the analysis, such as a chart showing revenue trends by day of the week or a table ranking campaigns by ROAS.
