class PersonalAgentClient {
  constructor() {
    this.providerSelect = document.getElementById("agent-provider");
    this.modelSelect = document.getElementById("agent-model");
    this.apiKeyInput = document.getElementById("agent-api-key");
    this.btnSaveKey = document.getElementById("btn-save-key");
    this.btnToggleKeyVis = document.getElementById("btn-toggle-key-vis");
    this.btnToggleSettings = document.getElementById("btn-toggle-key-settings");
    this.settingsDrawer = document.getElementById("personal-settings-drawer");
    this.statusIndicator = document.getElementById("key-saved-indicator");

    this.chatWindow = document.getElementById("personal-chat-window");
    this.input = document.getElementById("personal-input");
    this.btnSend = document.getElementById("btn-personal-send");
    this.btnInspect = document.getElementById("btn-personal-inspect");
    this.btnExplain = document.getElementById("btn-personal-explain");

    this.btnHelpKey = document.getElementById("btn-help-api-key");
    this.helpBox = document.getElementById("api-key-help-box");
    this.btnCloseHelp = document.getElementById("btn-close-help-box");
    this.helpTitle = document.getElementById("help-provider-title");
    this.helpContent = document.getElementById("help-provider-content");

    this.currentLabId = null;
    this.history = [];

    this.providerModels = {
      builtin: [
        { id: "ccie-local", name: "CCIE NetOps Engine (Built-in / Zero-Key / Always Online)" }
      ],
      google: [
        { id: "gemini-1.5-flash", name: "gemini-1.5-flash (Ultra Stable & Fast)" },
        { id: "gemini-3.8-flash", name: "gemini-3.8-flash (Latest)" },
        { id: "gemini-1.5-pro", name: "gemini-1.5-pro (Deep Reasoning)" },
        { id: "gemini-3.8-pro", name: "gemini-3.8-pro" }
      ],
      anthropic: [
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Recommended)" },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Lightweight)" }
      ],
      openai: [
        { id: "gpt-4o", name: "GPT-4o (Omni / Flagship)" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "o1-mini", name: "o1-mini (Deep Reasoning)" }
      ]
    };

    this._bindEvents();
    this._loadSavedSettings();
  }

  setLab(labId) {
    this.currentLabId = labId;
  }

  _bindEvents() {
    // Provider change
    if (this.providerSelect) {
      this.providerSelect.addEventListener("change", () => {
        this._updateModelOptions();
        this._loadKeyForCurrentProvider();
        this._updateHelpWalkthrough();
      });
    }

    // Toggle settings drawer
    if (this.btnToggleSettings && this.settingsDrawer) {
      this.btnToggleSettings.addEventListener("click", () => {
        this.settingsDrawer.classList.toggle("open");
      });
    }

    // Toggle password visibility
    if (this.btnToggleKeyVis && this.apiKeyInput) {
      this.btnToggleKeyVis.addEventListener("click", () => {
        if (this.apiKeyInput.type === "password") {
          this.apiKeyInput.type = "text";
          this.btnToggleKeyVis.textContent = "🙈";
        } else {
          this.apiKeyInput.type = "password";
          this.btnToggleKeyVis.textContent = "👁";
        }
      });
    }

    // Toggle Help Box
    if (this.btnHelpKey) {
      this.btnHelpKey.addEventListener("click", () => {
        this._updateHelpWalkthrough();
        this.helpBox.classList.toggle("hidden");
      });
    }

    if (this.btnCloseHelp) {
      this.btnCloseHelp.addEventListener("click", () => {
        this.helpBox.classList.add("hidden");
      });
    }

    // Save Key
    if (this.btnSaveKey) {
      this.btnSaveKey.addEventListener("click", () => {
        const provider = this.providerSelect ? this.providerSelect.value : "google";
        const key = this.apiKeyInput ? this.apiKeyInput.value.trim() : "";
        if (key) {
          localStorage.setItem(`netlab_key_${provider}`, key);
          if (this.statusIndicator) {
            this.statusIndicator.textContent = "✓ Key saved for " + provider.toUpperCase();
            this.statusIndicator.style.color = "#10b981";
          }
          setTimeout(() => {
            if (this.settingsDrawer) this.settingsDrawer.classList.remove("open");
          }, 800);
        } else {
          localStorage.removeItem(`netlab_key_${provider}`);
          if (this.statusIndicator) {
            this.statusIndicator.textContent = "Key cleared";
            this.statusIndicator.style.color = "#f59e0b";
          }
        }
      });
    }

    // Send chat
    if (this.btnSend) {
      this.btnSend.addEventListener("click", () => this.sendMessage());
    }
    if (this.input) {
      this.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
    }

    // Quick Actions
    if (this.btnInspect) {
      this.btnInspect.addEventListener("click", () => {
        this.sendMessage("Please perform a deep inspection of my running configurations and pyATS diagnostics. What is causing the problem and what steps should I take next?");
      });
    }

    if (this.btnExplain) {
      this.btnExplain.addEventListener("click", () => {
        this.sendMessage("Can you explain the underlying networking theory and RFC mechanics behind the issue I am seeing in this lab?");
      });
    }
  }

  _loadSavedSettings() {
    this._updateModelOptions();
    this._loadKeyForCurrentProvider();
  }

  _updateModelOptions() {
    if (!this.providerSelect || !this.modelSelect) return;
    const provider = this.providerSelect.value;
    const models = this.providerModels[provider] || [];
    this.modelSelect.innerHTML = "";
    models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      this.modelSelect.appendChild(opt);
    });
  }

  _loadKeyForCurrentProvider() {
    if (!this.providerSelect) return;
    const provider = this.providerSelect.value;
    const savedKey = localStorage.getItem(`netlab_key_${provider}`) || "";
    if (this.apiKeyInput) this.apiKeyInput.value = savedKey;
    if (this.statusIndicator) {
      if (savedKey) {
        this.statusIndicator.textContent = "✓ Saved key loaded (" + provider.toUpperCase() + ")";
        this.statusIndicator.style.color = "#10b981";
      } else {
        this.statusIndicator.textContent = "No key configured yet";
        this.statusIndicator.style.color = "#94a3b8";
      }
    }
  }

  _updateHelpWalkthrough() {
    if (!this.helpTitle || !this.helpContent) return;
    const provider = this.providerSelect.value;

    if (provider === "google") {
      this.helpTitle.textContent = "How to get a Free Google Gemini API Key";
      this.helpContent.innerHTML = `
        <ol>
          <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio (aistudio.google.com)</a>.</li>
          <li>Sign in with your standard Google / Gmail account.</li>
          <li>Click the blue <strong>"Create API key"</strong> button (takes ~10 seconds).</li>
          <li>Copy your key (starts with <code>AIzaSy...</code>).</li>
          <li>Paste it into the API Key field above and click <strong>Save Key</strong>.</li>
        </ol>
        <div class="note">✨ <strong>Free tier:</strong> Google provides a free quota of up to 15 requests per minute with no billing required.</div>
      `;
    } else if (provider === "anthropic") {
      this.helpTitle.textContent = "How to get an Anthropic Claude API Key";
      this.helpContent.innerHTML = `
        <ol>
          <li>Open the <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Console (console.anthropic.com)</a>.</li>
          <li>Sign in or create an account.</li>
          <li>Navigate to <strong>API Keys</strong> in the dashboard and click <strong>Create Key</strong>.</li>
          <li>Copy the key (starts with <code>sk-ant-...</code>).</li>
          <li>Paste it into the field above and click <strong>Save Key</strong>.</li>
        </ol>
      `;
    } else if (provider === "openai") {
      this.helpTitle.textContent = "How to get an OpenAI API Key";
      this.helpContent.innerHTML = `
        <ol>
          <li>Open the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI API Keys page</a>.</li>
          <li>Sign in to your OpenAI account.</li>
          <li>Click <strong>"Create new secret key"</strong>.</li>
          <li>Copy your secret key (starts with <code>sk-proj-...</code>).</li>
          <li>Paste it into the field above and click <strong>Save Key</strong>.</li>
        </ol>
      `;
    }
  }

  async sendMessage(overrideText = null) {
    const text = overrideText || this.input.value.trim();
    if (!text || !this.currentLabId) return;

    if (!overrideText) {
      this.input.value = "";
    }

    const provider = this.providerSelect.value;
    const model = this.modelSelect.value;
    const apiKey = this.apiKeyInput.value.trim() || localStorage.getItem(`netlab_key_${provider}`) || "";

    if (provider !== "builtin" && !apiKey) {
      this.settingsDrawer.classList.add("open");
      this._updateHelpWalkthrough();
      if (this.helpBox) this.helpBox.classList.remove("hidden");
      this.appendMessage("mentor", `⚠️ **API Key Required**: Please configure your **${provider.toUpperCase()}** API key in the settings drawer above. Or choose **Built-in CCIE Brain** for instant answers without an API key.`);
      return;
    }

    this.appendMessage("student", text);
    this.btnSend.disabled = true;

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider,
          api_key: apiKey,
          model: model,
          lab_id: this.currentLabId,
          message: text,
          history: this.history
        })
      });

      const data = await res.json();
      this.appendMessage("mentor", data.reply, `${data.provider} (${data.model})`);

      // Keep recent history
      this.history.push({ role: "user", content: text });
      this.history.push({ role: "assistant", content: data.reply });
      if (this.history.length > 8) this.history = this.history.slice(-8);

    } catch (e) {
      this.appendMessage("mentor", `⚠️ Failed to reach ${provider.toUpperCase()} AI agent: ${e.message}`);
    } finally {
      this.btnSend.disabled = false;
    }
  }

  appendMessage(sender, text, subtext = null) {
    const msgEl = document.createElement("div");
    msgEl.className = `chat-message ${sender}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = sender === "mentor" ? "Personal AI Mentor" : "Student";

    let bodyHtml = this._formatMarkdown(text);
    if (subtext) {
      bodyHtml += `<div style="margin-top:0.5rem; font-size:0.72rem; color:#64748b; text-align:right;">Generated by ${subtext}</div>`;
    }

    msgEl.innerHTML = `
      <div class="msg-header">
        <span class="msg-sender">${senderName}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-body">${bodyHtml}</div>
    `;

    this.chatWindow.appendChild(msgEl);
    this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
  }

  _formatMarkdown(md) {
    if (!md) return "";
    let html = md
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^- (.*)$/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }
}
