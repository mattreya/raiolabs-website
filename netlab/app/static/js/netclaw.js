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
