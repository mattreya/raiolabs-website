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
