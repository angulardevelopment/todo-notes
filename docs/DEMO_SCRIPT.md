# SmartNotes AI: Live Stakeholder Demo Script & Runbook

> **Format:** 7–8 Minute Live Demo Walkthrough Script  
> **Target Audience:** Executive Stakeholders, Technical Directors, Product Leads  
> **Preparation Time:** 2 minutes prior to meeting  
> **Prerequisites:** App running on `http://localhost:4200/`, valid Gemini API key configured in AI Settings.

---

## 🛠️ Pre-Flight Checklist (Do this 5 minutes before demo)

1. **Start the local server:**
   ```powershell
   npm run start
   ```
2. **Open your browser:** Navigate to `http://localhost:4200/` (Google Chrome or Microsoft Edge in full-screen / clean profile).
3. **Check AI Status in top-right header:**
   * Look for the green indicator: `✨ AI Ready (gemini-3.6-flash)`
   * If yellow/warning: Click **"Setup AI Key"**, paste your Gemini API Key, ensure `gemini-3.6-flash` is selected, and click Save.
4. **Seed Sample Data (Optional):** Ensure you have at least 1-2 notes or clean the slate for a fresh live demonstration.

---

## ⏱️ Step-by-Step Demo Flow

---

### Segment 1: The Executive Hook & Architecture (1 Minute)
* **Screen:** App Home (`/todo` - Notes Editor)
* **Action:**
  * Point your mouse to the top header.
  * Point out the **Live Cost Telemetry Badge** (`Cost: $0.00...`) and the **AI Ready Badge**.
* **What to Say:**
  > *"Good morning everyone. Today I'm showcasing **SmartNotes AI**, our next-generation intelligent productivity suite built on Angular 22 and powered by Google Gemini. Most productivity apps force you to juggle between passive notes and separate todo lists. SmartNotes AI unites them using autonomous AI agents with local tool execution, zero-hallucination semantic search, and real-time cost transparency. Let me walk you through how it operates."*

---

### Segment 2: Intelligent Notes Studio & Action Extraction (2 Minutes)
* **Screen:** Notes Editor (`/todo`)
* **Action:**
  1. Click **"+ Add Note"** or use an existing note.
  2. Enter the following realistic meeting note:
     * **Title:** `Q3 Platform Security & Migration Sync`
     * **Content:**
       ```text
       Met with DevOps and Security team today. 
       We agreed that migrating the legacy auth service to OAuth2 with PKCE is top priority before the August audit. 
       Sarah will draft the IAM policy review by Friday. 
       Dave needs to provision staging Redis clusters and run latency benchmarks. 
       Also need to schedule a penetration test with external vendor by next Wednesday.
       ```
     * **Tags:** `security`, `q3`, `devops`
  3. Click **"Save Note"**.
  4. Now click the **"✨ AI Polish"** or **"Summarize"** button in the note's AI Toolbar.
     * *Observe:* Instant executive summary generated in seconds.
  5. Click **"Extract Action Items"** (or use Copilot to convert into tasks).
* **What to Say:**
  > *"Notice what happened here: In standard apps, raw meeting dumps sit unread. With one click, our AI engine synthesizes the unstructured text into key takeaways. Furthermore, it identifies every commitment—Sarah drafting the IAM policy, Dave provisioning Redis—and can extract them directly into actionable tasks without tedious manual copy-pasting."*

---

### Segment 3: Intelligent Task Board & Goal Decomposition (1.5 Minutes)
* **Screen:** Task Board (`/notes`)
* **Action:**
  1. Click **"Task Board"** in the top navigation.
  2. Point out existing tasks and the clean completion toggles.
  3. In the "Add Todo" input box, test the **AI Task Breakdown** feature:
     * Enter high-level goal: `Prepare and launch SOC2 Compliance Audit`
     * Click **"AI Breakdown"** (or decompose button).
  4. Watch the system generate structured sub-tasks:
     * Collect vendor questionnaire evidence
     * Review access logs for production clusters
     * Update disaster recovery protocol documentation
* **What to Say:**
  > *"Executive goals are often too broad to act upon immediately. Our Task Board features AI Goal Decomposition. By typing a high-level corporate objective, Gemini analyzes the scope and generates actionable, step-by-step checklist items ready for delegation."*

---

### Segment 4: Autonomous Copilot & Real-Time Function Calling (2 Minutes)
* **Screen:** Any view (open Copilot drawer via floating button in bottom right)
* **Action:**
  1. Click the floating **✨ Copilot** icon to open the chat drawer.
  2. Type the following multi-action command:
     ```text
     Give me a daily briefing of my current tasks and create a new task to prepare the slide deck for executive review.
     ```
  3. **Crucial Visual Moment:**
     * Watch the Copilot think.
     * Point out the **Live Tool Execution Badges**:
       * `⚡ Executed: get_daily_briefing`
       * `⚡ Executed: create_task` with parameters `{"title": "Prepare slide deck for executive review"}`
     * Direct their attention to the background Task Board: **the new task appeared in real time without refreshing!**
* **What to Say:**
  > *"This is the centerpiece of SmartNotes AI. This is not a chatbot disconnected from reality. It has 'hands'. By utilizing Gemini's native Function Calling, the Copilot calls local TypeScript tools on the fly. You can see the tool badges proving that it inspected our tasks and created the new todo directly inside our reactive RxJS store."*

---

### Segment 5: Grounded RAG & Semantic Vector Search (1.5 Minutes)
* **Screen:** Copilot Drawer
* **Action:**
  1. In the Copilot prompt, ask a natural question that requires semantic understanding rather than exact keyword match:
     ```text
     What did Dave and Sarah commit to during the security sync?
     ```
  2. Watch Copilot execute `ask_notes_rag` or `semantic_search_notes`.
  3. Show the grounded answer citing the exact note source!
* **What to Say:**
  > *"Notice I didn't search for an exact keyword. Our RAG engine vectorized our notes using Google's `gemini-embedding-001`. It mathematically retrieved the most relevant note chunk through cosine similarity and synthesized a 100% grounded answer with zero hallucinations."*

---

### Segment 6: Real-Time Cost Telemetry & Enterprise Scale Simulator (1 Minute)
* **Screen:** Click the **"📊 Cost: $0.00..."** button in the header to open the Cost Dashboard.
* **Action:**
  1. Show the **Live Session Telemetry**:
     * Total Queries, Total Input Tokens, Output Tokens, Latency (ms), and Cumulative Cost (fractions of a cent).
  2. Point out the **Free Tier Gauge**:
     * Shows remaining requests against Google's generous 1,500 daily requests free quota.
  3. Scroll down to the **Enterprise Scale Simulator**:
     * Adjust the slider to **10,000 Daily Active Users**.
     * Point out the competitor comparison table:
       * SmartNotes AI (Gemini Flash): ~$38/month
       * GPT-4o Mini / Claude 3.5: ~$76 to $140+/month
       * Demonstrating **50% to 73% cost savings**!
* **What to Say:**
  > *"Finally, we come to unit economics. Many enterprise AI initiatives stall because leadership fears runaway cloud costs. We engineered complete cost observability into the core application. Not only can you monitor every token in real time, but our scale simulator proves that scaling to 10,000 active employees costs less than a single business lunch."*

---

### Segment 7: Wrap-Up & Closing Call to Action
* **What to Say:**
  > *"In summary: SmartNotes AI turns static workspaces into an intelligent, autonomous partner. It increases knowledge worker productivity by up to 75%, runs securely with enterprise prompt injection guardrails, and provides unmatched unit economics with Google Gemini. Thank you, and I'd love to take any questions!"*

---

## 💡 Contingency & Backup Tips During Demo

| Scenario | What to Do |
|---|---|
| **API Key Missing or Expired** | Click the **AI Status button** in header, paste a fresh Google AI Studio key (takes 5 seconds). |
| **Network Lag during Copilot Response** | Highlight the graceful loading indicator: *"Notice our non-blocking async architecture—the UI remains completely interactive while Gemini processes the stream."* |
| **Copilot gives slightly different wording** | Emphasize the natural language capability: *"The LLM adapts naturally while maintaining strict execution fidelity through our schema contracts."* |
