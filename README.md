# Clarity - Intelligent Financial Tracking by SAP

Clarity is a professional financial management platform designed to provide deep insights into your spending habits through real-time analytics and advanced AI integration.

## 🚀 Core Features

### 📊 Interactive Dashboard
- **Dynamic Charting:** Visualize Revenue, Expenses, and Surplus using an interactive line chart (powered by Chart.js).
- **Intelligent Filtering:** 
    - Presets for Week, Month, Year, and specific Quarters.
    - **Custom Range:** Select precise start and end dates.
    - **Smart Scaling:** The graph automatically switches between daily and monthly views based on the selected period.
- **Improved Legend:** Optimized layout with the chart legend positioned at the bottom for better data visibility.
- **Today Indicator:** A dynamic vertical line marks the current date in the graph for instant temporal orientation.
- **KPI Cards:** Instant overview of total income, outgoings, and net surplus with visual progress indicators.

### 📑 Transaction Management
- **Infinite Scroll:** Efficient loading of large datasets (batches of 25) without page lag.
- **Precision Filtering:** Filter by **Category**, **Date**, **Full-text search**, or specific **Transaction ID**.
- **Interactive Sorting:** Click any column header to sort your data server-side.
- **Visual Filter Tags:** Active filters (including the new "Item ID" tag) are displayed as colorful chips in the header for easy state management.
- **Context Menu:** Right-click any entry to Edit, Delete, or directly **"Ask Joule"** about that specific transaction.

### 💎 Joule AI Assistant (Perfected)
- **Context-Aware Personality:** Joule is a highly specialized SAP-style assistant—professional, discrete, and precise.
- **Deep Personalization:** Using the new `user_config.json`, Joule knows your name, nickname, department, and location for a tailored experience.
- **Interactive Attachments:** Click on a transaction chip in the chat to **instantly jump** to that entry in your dashboard.
- **Intelligent Financial Knowledge:** Joule has direct backend access to your financial summary (balance, top categories, trends) and can answer many questions instantly.
- **Voice-to-Action:** Joule can add transactions for you (e.g., "Add 15.50€ for apples at EDEKA").
- **Clean Communication:** Joule uses proper Markdown formatting (**bold amounts**, clean lists) and avoids all technical jargon or brackets in conversation.
- **Persistence:** Chat history is saved across sessions with a notification system for new AI insights.

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite3 (Server-side filtering, sorting, and ID-based lookup)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3, Marked.js (Markdown support)
- **AI Engine:** Groq API (Llama 3.3 models)
- **Visualization:** Chart.js

## ⚙️ Setup & Configuration

1. **Environment:** Create a `.env` file in the root directory with your `GROQ_API_KEY`.
2. **Personalization:** Customize your profile in `App/db/user_config.json` or via the **Settings** page in the app.
3. **Installation:** Run `npm install` to set up dependencies.
4. **Start Server:** 
   ```bash
   npm start
   ```
5. **Access:** Open your browser at `http://localhost:3000`.

---
*Created as part of the SAP Winter Internship Program 2026. Perfected for robustness and intelligence.*
