# GenAI Integration & Cloud Service Mapping

This document describes how Generative AI services (via Azure OpenAI) are mapped into the Ease Park AI system to improve user experience and administrative capabilities.

## 1. Natural Language Chatbot (Passenger / Driver Assistant)
**Use Case:** Allow users to talk to the system ("Where is my car parked?" or "What's the prediction score for my slot?") instead of navigating menus manually.
**Mapped Azure Service:** **Azure OpenAI Service (GPT-4o)**
**Implementation:**
- A floating `AIHelper.tsx` component is integrated directly into the `App.tsx` routing layout so it's accessible across the portal.
- Retrieves system context (current session, floor availability) and feeds it to the LLM.

## 2. Feedback & Support Analyzer
**Use Case:** Users can submit feedback or report issues (e.g. "The boom barrier at Entry A is broken"). GenAI processes the reports and surfaces critical maintenance tasks based on text priority.
**Mapped Azure Service:** **Azure AI Text Analytics (or Azure OpenAI fine-tuning for classification)**
**Implementation:**
- Periodic batch jobs to analyze feedback and sort by urgency (e.g., "urgent", "feature request", "complaint").

## 3. Intelligent Vitals Summarizer (Future Admin Feature)
**Use Case:** When an administrator opens the dashboard, they receive an executive summary generated from numerical data (e.g., "Peak traffic occurred at 3 PM today due to event X. Consider opening the backup rooftop floor earlier tomorrow.").
**Mapped Azure Service:** **Azure OpenAI (GPT-3.5/4)**
**Implementation:**
- Feeds standard traffic and income logs to an LLM to generate plain-text highlights.

## Proof of Implementation
The foundation is built in our repository logic via:
- `.env` environment loading (OpenAI API key structures matching standard Azure setup).
- Sample AI integration inside the mocked chatbot tool (`AIHelper.tsx`).
