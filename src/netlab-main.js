class TopologyRenderer {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.activeNodeId = null;
    this.onNodeClickCallback = null;
  }

  onNodeClick(callback) {
    this.onNodeClickCallback = callback;
  }

  render(topologyData, activeNodeId = null) {
    this.activeNodeId = activeNodeId;
    this.svg.innerHTML = "";

    if (!topologyData || !topologyData.nodes) return;

    // Draw Links first (behind nodes)
    const linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linksGroup.setAttribute("class", "topo-links");

    (topologyData.links || []).forEach(link => {
      const fromNode = topologyData.nodes.find(n => n.id === link.from);
      const toNode = topologyData.nodes.find(n => n.id === link.to);
      if (!fromNode || !toNode) return;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);

      let strokeColor = "#38bdf8"; // default blue
      if (link.status === "warning") strokeColor = "#f59e0b"; // amber
      if (link.status === "active") strokeColor = "#10b981"; // emerald

      line.setAttribute("stroke", strokeColor);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-dasharray", link.status === "warning" ? "6,4" : "none");
      linksGroup.appendChild(line);

      // Link label (IP / Subnet)
      if (link.label) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2 - 10;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", midX);
        text.setAttribute("y", midY);
        text.setAttribute("fill", "#94a3b8");
        text.setAttribute("font-size", "11");
        text.setAttribute("font-family", "Fira Code, monospace");
        text.setAttribute("text-anchor", "middle");
        text.textContent = link.label;
        linksGroup.appendChild(text);
      }
    });

    this.svg.appendChild(linksGroup);

    // Draw Nodes
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "topo-nodes");

    topologyData.nodes.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "topo-node");
      g.setAttribute("cursor", "pointer");
      g.style.transition = "transform 0.15s ease";

      const isActive = (node.id === this.activeNodeId);

      // Outer Selection Ring
      if (isActive) {
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", node.x);
        ring.setAttribute("cy", node.y);
        ring.setAttribute("r", "32");
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#38bdf8");
        ring.setAttribute("stroke-width", "2");
        ring.setAttribute("stroke-dasharray", "4,3");
        g.appendChild(ring);
      }

      // Main Node Circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
      circle.setAttribute("r", "24");
      circle.setAttribute("fill", isActive ? "#1e293b" : "#0f172a");
      circle.setAttribute("stroke", isActive ? "#38bdf8" : "#334155");
      circle.setAttribute("stroke-width", "2.5");
      g.appendChild(circle);

      // Router Icon Text
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
      icon.setAttribute("x", node.x);
      icon.setAttribute("y", node.y + 5);
      icon.setAttribute("fill", isActive ? "#38bdf8" : "#e2e8f0");
      icon.setAttribute("font-size", "14");
      icon.setAttribute("font-weight", "bold");
      icon.setAttribute("text-anchor", "middle");
      icon.setAttribute("font-family", "Inter, sans-serif");
      icon.textContent = node.id.toUpperCase();
      g.appendChild(icon);

      // Node Label (Below)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", node.x);
      label.setAttribute("y", node.y + 45);
      label.setAttribute("fill", "#f8fafc");
      label.setAttribute("font-size", "12");
      label.setAttribute("font-weight", "600");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-family", "Inter, sans-serif");
      label.textContent = node.label || node.id;
      g.appendChild(label);

      // IP Subtext
      if (node.ip) {
        const ipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        ipText.setAttribute("x", node.x);
        ipText.setAttribute("y", node.y + 60);
        ipText.setAttribute("fill", "#64748b");
        ipText.setAttribute("font-size", "10");
        ipText.setAttribute("font-family", "Fira Code, monospace");
        ipText.setAttribute("text-anchor", "middle");
        ipText.textContent = node.ip;
        g.appendChild(ipText);
      }

      // Click Event
      g.addEventListener("click", () => {
        if (this.onNodeClickCallback) {
          this.onNodeClickCallback(node.id);
        }
      });

      nodesGroup.appendChild(g);
    });

    this.svg.appendChild(nodesGroup);
  }

  setActiveNode(nodeId, topologyData) {
    this.render(topologyData, nodeId);
  }
}
class TerminalManager {
  constructor(containerId, tabsContainerId) {
    this.container = document.getElementById(containerId);
    this.tabsContainer = document.getElementById(tabsContainerId);
    this.sessions = {}; // nodeName -> { term, fitAddon, socket, termEl }
    this.activeNode = null;
    this.currentLabId = null;
    this.onTabChangeCallback = null;

    if (this.container) {
      this.container.addEventListener("click", () => {
        if (this.activeNode && this.sessions[this.activeNode]) {
          this.sessions[this.activeNode].term.focus();
        }
      });
    }
  }

  onTabChange(callback) {
    this.onTabChangeCallback = callback;
  }

  initLab(labId, nodes) {
    this.currentLabId = labId;
    this.clearAll();

    // Build tabs
    this.tabsContainer.innerHTML = "";
    nodes.forEach((node, idx) => {
      const nodeName = node.name;
      const tab = document.createElement("button");
      tab.className = `tab-btn ${idx === 0 ? "active" : ""}`;
      tab.id = `tab-${nodeName}`;
      tab.innerHTML = `<span class="tab-dot"></span> ${node.displayName || nodeName.toUpperCase()}`;
      tab.addEventListener("click", () => this.switchTab(nodeName));
      this.tabsContainer.appendChild(tab);

      // Create Terminal wrapper element
      const termEl = document.createElement("div");
      termEl.id = `term-${nodeName}`;
      termEl.style.width = "100%";
      termEl.style.height = "100%";
      termEl.style.display = idx === 0 ? "block" : "none";
      this.container.appendChild(termEl);

      // Init xterm instance with explicit fallback rows/cols
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'Fira Code', 'Courier New', monospace",
        cols: 90,
        rows: 25,
        theme: {
          background: "#02050c",
          foreground: "#e2e8f0",
          cursor: "#38bdf8",
          black: "#0f172a",
          red: "#ef4444",
          green: "#10b981",
          yellow: "#f59e0b",
          blue: "#38bdf8",
          magenta: "#c084fc",
          cyan: "#22d3ee",
          white: "#f8fafc"
        }
      });

      const fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      term.open(termEl);

      // Intercept Tab key specifically so the browser doesn't shift focus away from xterm
      term.attachCustomKeyEventHandler((event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          if (event.type === "keydown") {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === 1) {
              socket.send("\t");
            }
          }
          return false; // Prevent browser Tab navigation
        }
        return true;
      });

      // Click on wrapper gives terminal focus
      termEl.addEventListener("click", () => term.focus());

      // Open WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${labId}/${nodeName}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (idx === 0) {
          term.focus();
        }
      };

      socket.onmessage = (event) => {
        term.write(event.data);
      };

      socket.onerror = (err) => {
        console.error(`WebSocket error on ${nodeName}:`, err);
        term.write("\r\n\x1b[31m[WebSocket connection error]\x1b[0m\r\n");
      };

      term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === 1) {
          socket.send(data);
        }
      });

      // Fit addon safely after layout
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {}
      }, 100);

      this.sessions[nodeName] = { term, fitAddon, socket, termEl };
    });

    if (nodes.length > 0) {
      this.activeNode = nodes[0].name;
      setTimeout(() => {
        if (this.sessions[this.activeNode]) {
          try {
            this.sessions[this.activeNode].fitAddon.fit();
          } catch (e) {}
          this.sessions[this.activeNode].term.focus();
        }
      }, 150);
    }
  }

  switchTab(nodeName) {
    if (!this.sessions[nodeName]) return;
    this.activeNode = nodeName;

    // Update tab UI
    this.tabsContainer.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.id === `tab-${nodeName}`);
    });

    // Toggle terminal visibility
    Object.keys(this.sessions).forEach(name => {
      const s = this.sessions[name];
      s.termEl.style.display = (name === nodeName) ? "block" : "none";
    });

    // Fit & focus active terminal
    const activeSession = this.sessions[nodeName];
    if (activeSession) {
      setTimeout(() => {
        try {
          activeSession.fitAddon.fit();
        } catch (e) {}
        activeSession.term.focus();
      }, 50);
    }

    if (this.onTabChangeCallback) {
      this.onTabChangeCallback(nodeName);
    }
  }

  sendQuickCommand(cmd) {
    if (!this.activeNode || !this.sessions[this.activeNode]) return;
    const session = this.sessions[this.activeNode];
    if (session.socket.readyState === WebSocket.OPEN || session.socket.readyState === 1) {
      session.socket.send(cmd + "\r");
    }
  }

  fitAll() {
    if (this.activeNode && this.sessions[this.activeNode]) {
      setTimeout(() => {
        try {
          this.sessions[this.activeNode].fitAddon.fit();
        } catch (e) {}
      }, 100);
    }
  }

  clearAll() {
    Object.values(this.sessions).forEach(s => {
      try { s.socket.close(); } catch (e) {}
      try { s.term.dispose(); } catch (e) {}
      if (s.termEl && s.termEl.parentNode) {
        s.termEl.parentNode.removeChild(s.termEl);
      }
    });
    this.sessions = {};
  }
}
class NetClawClient {
  constructor(chatWindowId, inputId, sendBtnId, reviewBtnId, hintBtnId) {
    this.chatWindow = document.getElementById(chatWindowId);
    this.input = document.getElementById(inputId);
    this.sendBtn = document.getElementById(sendBtnId);
    this.reviewBtn = document.getElementById(reviewBtnId);
    this.hintBtn = document.getElementById(hintBtnId);
    this.hintIndicator = document.getElementById("hint-level-indicator");
    this.currentLabId = null;
    this.currentHintLevel = 1;
    this.maxHints = 3;

    this._bindEvents();
  }

  setLab(labId) {
    this.currentLabId = labId;
    this.currentHintLevel = 1;
    if (this.hintIndicator) this.hintIndicator.textContent = "1/3";
  }

  _bindEvents() {
    this.sendBtn.addEventListener("click", () => this.sendChatMessage());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendChatMessage();
    });

    this.reviewBtn.addEventListener("click", () => this.triggerReview());
    this.hintBtn.addEventListener("click", () => this.triggerHint());
  }

  async triggerReview() {
    if (!this.currentLabId) return;
    this.appendMessage("student", "Please review my current configurations and live state.");
    this.reviewBtn.disabled = true;

    try {
      const res = await fetch("/api/netclaw/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lab_id: this.currentLabId })
      });
      const data = await res.json();
      this.appendMessage("mentor", data.reply, data.structured_findings);
    } catch (e) {
      this.appendMessage("mentor", "⚠️ Failed to reach NetClaw review service.");
    } finally {
      this.reviewBtn.disabled = false;
    }
  }

  async triggerHint() {
    if (!this.currentLabId) return;
    this.hintBtn.disabled = true;

    try {
      const res = await fetch("/api/netclaw/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lab_id: this.currentLabId, level: this.currentHintLevel })
      });
      const data = await res.json();
      this.appendMessage("mentor", data.reply, data.structured_findings);

      // Cycle hint levels 1 -> 2 -> 3 -> 1
      this.currentHintLevel = (this.currentHintLevel % this.maxHints) + 1;
      if (this.hintIndicator) {
        this.hintIndicator.textContent = `${this.currentHintLevel}/${this.maxHints}`;
      }
    } catch (e) {
      this.appendMessage("mentor", "⚠️ Failed to fetch hint from NetClaw.");
    } finally {
      this.hintBtn.disabled = false;
    }
  }

  async sendChatMessage() {
    const text = this.input.value.trim();
    if (!text || !this.currentLabId) return;

    this.input.value = "";
    this.appendMessage("student", text);

    try {
      const res = await fetch("/api/netclaw/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lab_id: this.currentLabId, message: text })
      });
      const data = await res.json();
      this.appendMessage("mentor", data.reply, data.structured_findings);
    } catch (e) {
      this.appendMessage("mentor", "⚠️ NetClaw is currently unable to process your request.");
    }
  }

  appendMessage(sender, text, findings = null) {
    const msgEl = document.createElement("div");
    msgEl.className = `chat-message ${sender}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = sender === "mentor" ? "NetClaw" : "Student";

    let bodyHtml = this._formatMarkdown(text);

    if (findings && findings.length > 0) {
      bodyHtml += `<div style="margin-top:0.5rem; padding-top:0.4rem; border-top:1px dashed #283e68; font-size:0.75rem; color:#94a3b8;">`;
      findings.forEach(f => {
        bodyHtml += `<div>${f}</div>`;
      });
      bodyHtml += `</div>`;
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
      // Escaping
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Bullet lists
      .replace(/^- (.*)$/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      // Line breaks
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }
}
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
document.addEventListener("DOMContentLoaded", async () => {
  const labSelect = document.getElementById("lab-select");
  const labTitle = document.getElementById("lab-title");
  const labDifficulty = document.getElementById("lab-difficulty");
  const labTrack = document.getElementById("lab-track");
  const labTime = document.getElementById("lab-time");
  const labDesc = document.getElementById("lab-desc");
  const labObjective = document.getElementById("lab-objective");

  const btnReset = document.getElementById("btn-reset-lab");
  const btnValidate = document.getElementById("btn-validate-lab");

  // Panel toggles
  const appContainer = document.getElementById("app-container");
  const leftPanel = document.getElementById("left-panel");
  const rightPanel = document.getElementById("right-panel");
  const btnToggleLeft = document.getElementById("btn-toggle-left");
  const btnToggleRight = document.getElementById("btn-toggle-right");

  // Collapsible sections
  const btnCollapseDesc = document.getElementById("btn-collapse-desc");
  const labInfoBody = document.getElementById("lab-info-body");
  const btnCollapseObj = document.getElementById("btn-collapse-obj");
  const objectiveContent = document.getElementById("objective-content");
  const btnCollapseTopo = document.getElementById("btn-collapse-topo");
  const topologyBody = document.getElementById("topology-body");

  // Mentor Mode Switcher
  const tabNetclaw = document.getElementById("tab-mode-netclaw");
  const tabPersonal = document.getElementById("tab-mode-personal");
  const viewNetclaw = document.getElementById("view-netclaw");
  const viewPersonal = document.getElementById("view-personal");

  // Modal elements
  const modal = document.getElementById("validation-modal");
  const modalClose = document.getElementById("modal-close");
  const modalBtnOk = document.getElementById("modal-btn-ok");
  const modalScore = document.getElementById("modal-score");
  const modalFeedback = document.getElementById("modal-feedback");
  const modalChecklist = document.getElementById("modal-checklist");
  const postLabDebrief = document.getElementById("post-lab-debrief");
  const viewpointQuestionsContainer = document.getElementById("viewpoint-questions-container");
  const examCommandsContainer = document.getElementById("exam-commands-container");
  const modalBtnDiscuss = document.getElementById("modal-btn-discuss");
  const modalIcon = document.getElementById("modal-icon");

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  let currentLab = null;

  // Initialize components
  const topology = new TopologyRenderer("topology-svg");
  const terminal = new TerminalManager("terminal-container", "terminal-tabs");
  const netclaw = new NetClawClient(
    "netclaw-chat-window",
    "netclaw-input",
    "btn-netclaw-send",
    "btn-netclaw-review",
    "btn-netclaw-hint"
  );
  const personalAgent = new PersonalAgentClient();

  // Link Topology click to Terminal tab switch
  topology.onNodeClick((nodeId) => {
    terminal.switchTab(nodeId);
    if (currentLab && currentLab.topologyVisual) {
      topology.setActiveNode(nodeId, currentLab.topologyVisual);
    }
  });

  // Link Terminal tab switch to Topology highlight
  terminal.onTabChange((nodeId) => {
    if (currentLab && currentLab.topologyVisual) {
      topology.setActiveNode(nodeId, currentLab.topologyVisual);
    }
  });

  // Quick CLI buttons
  document.querySelectorAll(".btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const cmd = btn.getAttribute("data-cmd");
      if (cmd) terminal.sendQuickCommand(cmd);
    });
  });

  // --- COLLAPSIBLE LOGIC ---

  // Toggle Left Sidebar
  if (btnToggleLeft && leftPanel && appContainer) {
    btnToggleLeft.addEventListener("click", () => {
      leftPanel.classList.toggle("collapsed");
      appContainer.classList.toggle("left-collapsed");
      btnToggleLeft.classList.toggle("active");
      terminal.fitAll();
    });
  }

  // Toggle Right Mentor Sidebar
  if (btnToggleRight && rightPanel && appContainer) {
    btnToggleRight.addEventListener("click", () => {
      rightPanel.classList.toggle("collapsed");
      appContainer.classList.toggle("right-collapsed");
      btnToggleRight.classList.toggle("active");
      terminal.fitAll();
    });
  }

  // Toggle Lab Info / Description Card
  if (btnCollapseDesc && labInfoBody) {
    btnCollapseDesc.addEventListener("click", () => {
      const isCollapsed = labInfoBody.classList.toggle("collapsed");
      btnCollapseDesc.textContent = isCollapsed ? "▸" : "▾";
    });
  }

  // Toggle Objective inside card
  if (btnCollapseObj && objectiveContent) {
    btnCollapseObj.addEventListener("click", () => {
      const isHidden = objectiveContent.classList.toggle("collapsed");
      btnCollapseObj.textContent = isHidden ? "Show" : "Hide";
    });
  }

  // Toggle Topology Card
  if (btnCollapseTopo && topologyBody) {
    btnCollapseTopo.addEventListener("click", () => {
      const isCollapsed = topologyBody.classList.toggle("collapsed");
      btnCollapseTopo.textContent = isCollapsed ? "▸" : "▾";
    });
  }

  // Mentor Mode Switching (NetClaw vs Personal Cloud AI)
  if (tabNetclaw && tabPersonal && viewNetclaw && viewPersonal) {
    tabNetclaw.addEventListener("click", () => {
      tabNetclaw.classList.add("active");
      tabPersonal.classList.remove("active");
      viewNetclaw.classList.add("active");
      viewPersonal.classList.remove("active");
    });

    tabPersonal.addEventListener("click", () => {
      tabPersonal.classList.add("active");
      tabNetclaw.classList.remove("active");
      viewPersonal.classList.add("active");
      viewNetclaw.classList.remove("active");
    });
  }

  // Window resize handler for terminal
  window.addEventListener("resize", () => {
    terminal.fitAll();
  });

  // Load Catalog
  async function loadCatalog() {
    try {
      const res = await fetch("/api/labs");
      const catalog = await res.json();
      labSelect.innerHTML = "";

      catalog.forEach(lab => {
        const opt = document.createElement("option");
        opt.value = lab.id;
        opt.textContent = `${lab.track}: ${lab.title.split(":")[1] || lab.title}`;
        labSelect.appendChild(opt);
      });

      if (catalog.length > 0) {
        await loadLab(catalog[0].id);
      }
    } catch (e) {
      console.error("Failed to load catalog:", e);
    }
  }

  // Load Specific Lab
  async function loadLab(labId) {
    try {
      const res = await fetch(`/api/labs/${labId}`);
      currentLab = await res.json();

      // Update UI Header & Meta
      labTitle.textContent = currentLab.title;
      labDifficulty.textContent = currentLab.difficulty;
      labTrack.textContent = currentLab.track;
      labTime.textContent = currentLab.estimatedTime;
      labDesc.textContent = currentLab.description;
      labObjective.textContent = currentLab.objective;

      // Update Mentors
      netclaw.setLab(labId);
      personalAgent.setLab(labId);

      // Render Topology & Terminals
      const firstNode = (currentLab.nodes && currentLab.nodes.length > 0) ? currentLab.nodes[0].name : null;
      topology.render(currentLab.topologyVisual, firstNode);
      terminal.initLab(labId, currentLab.nodes);

    } catch (e) {
      console.error("Failed to load lab:", e);
    }
  }

  // Event: Change Lab Dropdown
  if (labSelect) {
    labSelect.addEventListener("change", (e) => {
      loadLab(e.target.value);
    });
  }

  // Event: Reset Lab
  if (btnReset) {
    btnReset.addEventListener("click", async () => {
      if (!currentLab) return;
      const confirmReset = confirm("Are you sure you want to reset this lab? All current configurations will be reverted to the seeded starting state.");
      if (!confirmReset) return;

      try {
        btnReset.disabled = true;
        btnReset.textContent = "Resetting...";
        await fetch(`/api/labs/${currentLab.id}/reset`, { method: "POST" });
        await loadLab(currentLab.id);
        netclaw.appendMessage("mentor", "🔄 Lab has been reset to its baseline seeded configuration.");
        personalAgent.appendMessage("mentor", "🔄 Lab has been reset to its baseline seeded configuration.");
      } catch (e) {
        alert("Failed to reset lab: " + e.message);
      } finally {
        btnReset.disabled = false;
        btnReset.innerHTML = `<span class="btn-icon">↺</span> Reset Lab`;
      }
    });
  }

  // Event: Validate Lab
  if (btnValidate) {
    btnValidate.addEventListener("click", async () => {
      if (!currentLab) return;

      btnValidate.disabled = true;
      btnValidate.textContent = "Checking...";

      try {
        const res = await fetch(`/api/labs/${currentLab.id}/validate`);
        const data = await res.json();

        modalScore.textContent = `${data.score} / ${data.total} Checks Passed`;
        modalScore.className = `modal-score-badge ${data.solved ? "pass" : "fail"}`;
        modalFeedback.textContent = data.feedback;

        modalChecklist.innerHTML = "";
        data.checks.forEach(c => {
          const li = document.createElement("li");
          li.className = c.passed ? "pass" : "fail";
          li.innerHTML = `<span>${c.passed ? "✓" : "✗"}</span> <span>${c.description}</span>`;
          modalChecklist.appendChild(li);
        });

        modal.classList.remove("hidden");

        if (data.solved) {
          if (modalIcon) modalIcon.textContent = "🏆";
          if (postLabDebrief) postLabDebrief.classList.remove("hidden");
          if (modalBtnDiscuss) modalBtnDiscuss.classList.remove("hidden");

          // Populate Viewpoint Questions
          const questions = data.viewpointQuestions || (currentLab && currentLab.viewpointQuestions) || [];
          if (viewpointQuestionsContainer) {
            viewpointQuestionsContainer.innerHTML = "";
            questions.forEach((q, idx) => {
              const card = document.createElement("div");
              card.className = "viewpoint-card";
              card.innerHTML = `
                <div class="viewpoint-q-header">
                  <span class="q-badge">Question ${idx + 1}</span>
                  <h5 class="q-text">${escapeHtml(q.question)}</h5>
                </div>
                <div class="viewpoint-actions">
                  <button class="btn btn-xs btn-outline btn-reveal-answer" data-target="ans-${q.id || idx}">
                    💡 Reveal Explanation
                  </button>
                </div>
                <div id="ans-${q.id || idx}" class="viewpoint-answer hidden">
                  <div class="answer-badge">Verified CCIE Explanation:</div>
                  <p class="answer-text">${escapeHtml(q.answer)}</p>
                </div>
              `;
              viewpointQuestionsContainer.appendChild(card);
            });

            // Bind toggle buttons
            viewpointQuestionsContainer.querySelectorAll(".btn-reveal-answer").forEach(btn => {
              btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-target");
                const ansEl = document.getElementById(targetId);
                if (ansEl) {
                  const isHidden = ansEl.classList.toggle("hidden");
                  btn.textContent = isHidden ? "💡 Reveal Explanation" : "▲ Hide Explanation";
                }
              });
            });
          }

          // Populate Key Exam Practice Commands
          const examCmds = data.examPracticeCommands || (currentLab && currentLab.examPracticeCommands) || [];
          if (examCommandsContainer) {
            examCommandsContainer.innerHTML = "";
            examCmds.forEach((c) => {
              const card = document.createElement("div");
              card.className = "exam-cmd-card";
              card.innerHTML = `
                <div class="cmd-header">
                  <code class="cmd-code">${escapeHtml(c.command)}</code>
                  <button class="btn-chip btn-run-cmd" data-cmd="${escapeHtml(c.command)}" title="Execute command in active terminal">▶ Run in CLI</button>
                </div>
                <div class="cmd-purpose"><strong>Purpose:</strong> ${escapeHtml(c.purpose)}</div>
                <div class="cmd-exam-tip"><span class="tip-icon">🎯</span> <strong>Exam Tip:</strong> ${escapeHtml(c.examTip)}</div>
              `;
              examCommandsContainer.appendChild(card);
            });

            // Bind run buttons
            examCommandsContainer.querySelectorAll(".btn-run-cmd").forEach(btn => {
              btn.addEventListener("click", () => {
                const cmd = btn.getAttribute("data-cmd");
                if (cmd) {
                  terminal.sendQuickCommand(cmd);
                  closeModal();
                }
              });
            });
          }

          netclaw.appendMessage("mentor", "🎉 **Verification Complete: Passed!** All objectives achieved.\n\n🧠 *Review the Viewpoint Recall Questions and Key Exam Commands in the debrief dialog to cement your certification preparation!*");
        } else {
          if (modalIcon) modalIcon.textContent = "⚠️";
          if (postLabDebrief) postLabDebrief.classList.add("hidden");
          if (modalBtnDiscuss) modalBtnDiscuss.classList.add("hidden");
          netclaw.appendMessage("mentor", `⚠️ **Verification Status:** ${data.score}/${data.total} checks passed. Ask for a hint or check configurations.`);
        }
      } catch (e) {
        alert("Failed to validate lab: " + e.message);
      } finally {
        btnValidate.disabled = false;
        btnValidate.innerHTML = `<span class="btn-icon">✓</span> Verify Solution`;
      }
    });
  }

  // Modal Close Events
  const closeModal = () => modal && modal.classList.add("hidden");
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBtnOk) modalBtnOk.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Event: Discuss Recall & Viewpoint Questions with AI Mentor
  if (modalBtnDiscuss) {
    modalBtnDiscuss.addEventListener("click", () => {
      closeModal();
      // Ensure right panel is visible
      const rightP = document.getElementById("right-panel");
      const appCont = document.getElementById("app-container");
      if (rightP && rightP.classList.contains("collapsed")) {
        rightP.classList.remove("collapsed");
        if (appCont) appCont.classList.remove("right-collapsed");
        terminal.fitAll();
      }
      netclaw.appendMessage("student", "I passed the lab! Can you quiz me on the viewpoint questions or test my readiness on the key exam commands?");
      setTimeout(() => {
        netclaw.appendMessage(
          "mentor",
          "🎯 **CCNP Debrief & Certification Review:**\n\n" +
          "Outstanding work passing all configuration checks! Let's test your conceptual recall:\n\n" +
          "*Can you explain why the default iBGP split-horizon rule prevents route reflection without an explicit client directive, and what loop-prevention attributes a Route Reflector attaches?*\n\n" +
          "Type your response below and I'll grade your answer!"
        );
      }, 500);
    });
  }

  // Start
  await loadCatalog();
});
