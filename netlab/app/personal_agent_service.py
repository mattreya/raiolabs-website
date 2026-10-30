import json
import httpx
from typing import Dict, Any, List, Optional
from app.lab_manager import lab_mgr
from app.netclaw_service import netclaw

class PersonalAgentService:
    """
    Service allowing students to connect their personal Cloud AI accounts
    (Google Gemini, OpenAI, or Anthropic Claude) directly to their Containerlab session.
    Injects live running configs and pyATS diagnostics into the prompt.
    """

    def build_lab_context(self, lab_id: str) -> str:
        lab = lab_mgr.get_lab_detail(lab_id) or {}
        title = lab.get("title", lab_id)
        objective = lab.get("objective", "Resolve networking issues.")
        track = lab.get("track", "CCNP")

        # Collect current running configurations from all active nodes
        configs_text = []
        for name, node in lab_mgr.nodes.items():
            cfg = node._generate_running_config()
            configs_text.append(f"=== {node.hostname} (node: {name}) CURRENT RUNNING CONFIG ===\n{cfg}\n")

        # Collect pyATS Genie diagnostics
        diag = netclaw.get_pyats_diagnostics(lab_id)
        diag_str = json.dumps(diag, indent=2)

        context = (
            f"You are a friendly, world-class Senior CCIE Network Architect and personalized tutor.\n"
            f"The student is currently working inside an interactive Containerlab CCNP training environment.\n\n"
            f"LAB METADATA:\n"
            f"- Track: {track}\n"
            f"- Lab Title: {title}\n"
            f"- Objective: {objective}\n\n"
            f"LIVE TELEMETRY & DEVICE CONFIGURATIONS (Captured directly from student's session):\n"
            f"{chr(10).join(configs_text)}\n"
            f"PYATS / GENIE STRUCTURED STATE SUMMARY:\n{diag_str}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. You have direct visibility into the exact commands and configurations the student has entered above.\n"
            f"2. Answer the student's question accurately and pedagogically based on their live setup.\n"
            f"3. Point out specific configuration discrepancies or interface issues when relevant.\n"
            f"4. Format your response cleanly in Markdown (use bolding, bullet points, and Cisco CLI syntax highlights where appropriate)."
        )
        return context

    async def chat(
        self,
        provider: str,
        api_key: str,
        message: str,
        lab_id: str,
        model: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, str]:
        prov = provider.lower().strip()
        system_context = self.build_lab_context(lab_id)

        try:
            if prov in ["local", "builtin", "ccie"]:
                local_res = netclaw.answer_student_chat(lab_id, message)
                return {
                    "reply": local_res.get("reply", ""),
                    "provider": "Built-in CCIE Brain",
                    "model": "offline-expert"
                }
            elif prov == "google":
                return await self._call_google_gemini(api_key, message, system_context, model or "gemini-1.5-flash", history)
            elif prov == "openai":
                return await self._call_openai(api_key, message, system_context, model or "gpt-4o", history)
            elif prov == "anthropic":
                return await self._call_anthropic(api_key, message, system_context, model or "claude-3-5-sonnet-20241022", history)
            else:
                return {
                    "reply": f"Unsupported provider '{provider}'. Please choose Google, OpenAI, or Anthropic.",
                    "provider": provider,
                    "model": model or "unknown"
                }
        except httpx.HTTPStatusError as e:
            error_detail = ""
            try:
                error_detail = e.response.text
            except Exception:
                pass
            
            # If Google API returned 503 or 429, fall back to our local CCIE NetOps engine seamlessly
            if e.response.status_code in [503, 429] and prov == "google":
                local_res = netclaw.answer_student_chat(lab_id, message)
                fallback_reply = (
                    f"⚠️ *(Google Gemini servers are temporarily experiencing high demand [503]. "
                    f"I have seamlessly routed your request to your built-in CCIE NetOps Brain so your lab is not interrupted)*\n\n"
                    + local_res.get("reply", "")
                )
                return {
                    "reply": fallback_reply,
                    "provider": "CCIE NetOps Brain (Auto-Failover)",
                    "model": "local-fallback"
                }

            return {
                "reply": f"❌ **{provider.upper()} API Error ({e.response.status_code})**: {error_detail or str(e)}\n\nPlease verify your API key and model selection.",
                "provider": provider,
                "model": model or "unknown"
            }
        except Exception as e:
            return {
                "reply": f"❌ **Connection Error**: {str(e)}",
                "provider": provider,
                "model": model or "unknown"
            }

    async def _call_google_gemini(
        self, api_key: str, message: str, system_context: str, model: str, history: Optional[List[Dict[str, str]]]
    ) -> Dict[str, str]:
        # Models to try with automatic fallback if initial model hits 503 (high demand)
        models_to_try = [model]
        if "gemini-1.5-flash" not in models_to_try:
            models_to_try.append("gemini-1.5-flash")
        if "gemini-1.5-pro" not in models_to_try:
            models_to_try.append("gemini-1.5-pro")

        # Build contents array
        contents = []
        if history:
            for turn in history[-4:]:
                role = "user" if turn.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})

        contents.append({
            "role": "user",
            "parts": [{"text": f"[SYSTEM INSTRUCTION]\n{system_context}\n\n[STUDENT QUERY]\n{message}"}]
        })

        async with httpx.AsyncClient(timeout=35.0) as client:
            for candidate_model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate_model}:generateContent?key={api_key.strip()}"
                try:
                    resp = await client.post(url, json={
                        "contents": contents,
                        "generationConfig": {"temperature": 0.4}
                    })

                    if resp.status_code in [503, 429]:
                        # Capacity spike on candidate_model; fall back to next model
                        continue

                    resp.raise_for_status()
                    data = resp.json()

                    candidates = data.get("candidates", [])
                    reply_text = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        reply_text = "".join(p.get("text", "") for p in parts)

                    if not reply_text:
                        reply_text = "Received empty response from Gemini."

                    if candidate_model != model:
                        reply_text += f"\n\n*(Note: `{model}` was temporarily busy on Google servers, so I automatically completed your request with `{candidate_model}`)*"

                    return {"reply": reply_text, "provider": "Google Gemini", "model": candidate_model}

                except httpx.HTTPStatusError as e:
                    if e.response.status_code in [503, 429] and candidate_model != models_to_try[-1]:
                        continue
                    raise e
                except Exception as e:
                    if candidate_model != models_to_try[-1]:
                        continue
                    raise e

        return {
            "reply": "❌ Google Gemini models are temporarily experiencing high demand. Please try again in a few moments.",
            "provider": "Google Gemini",
            "model": model
        }

    async def _call_openai(
        self, api_key: str, message: str, system_context: str, model: str, history: Optional[List[Dict[str, str]]]
    ) -> Dict[str, str]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }

        messages = [{"role": "system", "content": system_context}]
        if history:
            for turn in history[-4:]:
                role = "user" if turn.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": turn.get("content", "")})
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json={
                "model": model,
                "messages": messages,
                "temperature": 0.4
            })
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["choices"][0]["message"]["content"]
            return {"reply": reply_text, "provider": "OpenAI", "model": model}

    async def _call_anthropic(
        self, api_key: str, message: str, system_context: str, model: str, history: Optional[List[Dict[str, str]]]
    ) -> Dict[str, str]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key.strip(),
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        messages = []
        if history:
            for turn in history[-4:]:
                role = "user" if turn.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": turn.get("content", "")})
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json={
                "model": model,
                "max_tokens": 2000,
                "system": system_context,
                "messages": messages,
                "temperature": 0.4
            })
            resp.raise_for_status()
            data = resp.json()
            reply_text = "".join(b.get("text", "") for b in data.get("content", []))
            return {"reply": reply_text, "provider": "Anthropic Claude", "model": model}

# Global singleton
personal_agent = PersonalAgentService()
