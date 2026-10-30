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
