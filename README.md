# Clarity - Intelligent Financial Tracking by SAP

Clarity is a professional financial management platform designed to provide deep insights into your spending habits through real-time analytics and advanced AI integration.

## 🚀 Core Features

### 📊 Interactive Dashboard
- **Dynamic Charting:** Visualize Revenue, Expenses, and Surplus using an interactive line chart (powered by Chart.js).
- **Intelligent Filtering:** 
    - Presets for Week, Month, Year, and specific Quarters.
    - **Custom Range:** Select precise start and end dates.
    - **Smart Scaling:** The graph automatically switches between daily and monthly views based on the selected period to ensure clarity.
- **KPI Cards:** Instant overview of total income, outgoings, and net surplus with visual progress indicators.

### 📑 Transaction Management
- **Infinite Scroll:** Efficient loading of large datasets (batches of 25) without page lag.
- **Advanced Filtering:** Filter by **Category**, **Date** (via one-click in the list), or **Full-text search**.
- **Interactive Sorting:** Click any column header (Recipient, Amount, Date, etc.) to sort your data server-side.
- **Visual Filter Tags:** Active filters are displayed as colorful chips in the header, allowing for quick removal and clear state visualization.
- **Context Menu:** Right-click any entry to Edit, Delete, or directly **"Ask Joule"** about that specific transaction.

### 💎 Joule AI Assistant
- **Context-Aware Chat:** Joule has full access to your financial summary and transaction history.
- **Chat Attachments:** "Attach" a transaction to the chat to perform deep dives or specific analyses.
- **Voice-to-Action:** Joule can add transactions for you (e.g., "Add 15.50€ for apples at EDEKA").
- **Smart Clarification:** If details are missing, Joule will ask follow-up questions before committing data.
- **Personal Finance Advisor:** Ask for tips on budgeting, saving strategies, or long-term financial planning.
- **Persistence:** Chat history is saved across sessions, featuring a notification system (pulsing red dot) for unread AI responses.

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite3 (Server-side filtering & sorting)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Modern SAP-inspired design)
- **AI Engine:** Groq API (Llama 3.3 models)
- **Visualization:** Chart.js

## ⚙️ Setup & Installation

1. **Environment:** Create a `.env` file in the root directory with your `GROQ_API_KEY`.
2. **Installation:** Run `npm install` to set up dependencies.
3. **Database:** The database (`db/transactions.db`) is automatically initialized.
4. **Start Server:** 
   ```bash
   python3 server_manager.py start
   ```
5. **Access:** Open your browser at `http://localhost:3000`.

---
*Created as part of the SAP Winter Internship Program 2026.*
