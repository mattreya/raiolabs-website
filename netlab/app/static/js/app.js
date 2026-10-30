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
