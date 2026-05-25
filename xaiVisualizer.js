/**
 * Explainable AI (XAI) Visualizations Module
 * Generates custom high-fidelity SVG graphics to explain the Fuzzy Inference System logic:
 * 1. Membership Curves: Draws curves and shades active intersection areas.
 * 2. Defuzzification Curve: Visualizes aggregated Mamdani shape and the Centroid vertical.
 * 3. SHAP-style Force Plot: Explains criteria contribution relative to baseline expectation.
 * 4. Active Rules Inspector: Color-coded rules displaying activation levels.
 */

// Colors matching our premium glassmorphic palette
const COLORS = {
  primary: "#6366f1", // Indigo
  primaryLight: "rgba(99, 102, 241, 0.15)",
  secondary: "#a855f7", // Violet
  success: "#10b981", // Emerald
  successLight: "rgba(16, 185, 129, 0.2)",
  warning: "#f59e0b", // Amber
  warningLight: "rgba(245, 158, 11, 0.2)",
  danger: "#f43f5e", // Rose
  dangerLight: "rgba(244, 63, 94, 0.2)",
  textDark: "#94a3b8", // Slate 400
  textLight: "#f1f5f9", // Slate 100
  grid: "#334155", // Slate 700
  cardBorder: "rgba(255, 255, 255, 0.08)"
};

/**
 * Draws active membership functions for a given FuzzyVariable and a crisp input.
 */
function drawMembershipCurves(containerId, variable, crispValue) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = 180;
  const padding = { top: 25, right: 20, bottom: 30, left: 35 };

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.overflow = "visible";
  svg.style.cursor = "pointer";
  
  svg.addEventListener('click', (e) => {
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scaleX = (clickX - padding.left) / (width - padding.left - padding.right);
    const value = variable.min + scaleX * (variable.max - variable.min);
    const clampedValue = Math.max(variable.min, Math.min(variable.max, value));
    
    const event = new CustomEvent('membership-click', {
      detail: {
        varName: variable.name,
        value: clampedValue
      }
    });
    window.dispatchEvent(event);
  });

  // Coordinates Mapping helpers
  const mapX = (x) => padding.left + ((x - variable.min) / (variable.max - variable.min)) * (width - padding.left - padding.right);
  const mapY = (y) => height - padding.bottom - y * (height - padding.top - padding.bottom);

  // 1. Draw Grid & Axes
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Y-axis ticks (0, 0.5, 1.0)
  [0, 0.5, 1.0].forEach(yVal => {
    const y = mapY(yVal);
    // Grid Line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", COLORS.grid);
    line.setAttribute("stroke-width", "0.5");
    line.setAttribute("stroke-dasharray", "3,3");
    gridGroup.appendChild(line);

    // Text Label
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", padding.left - 8);
    txt.setAttribute("y", y + 4);
    txt.setAttribute("text-anchor", "end");
    txt.setAttribute("fill", COLORS.textDark);
    txt.style.fontFamily = "Inter, sans-serif";
    txt.style.fontSize = "10px";
    txt.textContent = yVal.toFixed(1);
    gridGroup.appendChild(txt);
  });

  // X-axis ticks (5 segments)
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const xVal = variable.min + (i / steps) * (variable.max - variable.min);
    const x = mapX(xVal);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", x);
    txt.setAttribute("y", height - 10);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("fill", COLORS.textDark);
    txt.style.fontFamily = "Inter, sans-serif";
    txt.style.fontSize = "10px";
    txt.textContent = xVal.toFixed(0);
    gridGroup.appendChild(txt);
  }
  svg.appendChild(gridGroup);

  // 2. Draw Curves & active shading
  const termColors = {
    // Standard 3-term mappings
    Low: COLORS.danger,
    Junior: COLORS.danger,
    Weak: COLORS.danger,
    Poor: COLORS.danger,
    Basic: COLORS.danger,
    Individualist: COLORS.danger,
    
    Medium: COLORS.warning,
    Mid: COLORS.warning,
    Moderate: COLORS.warning,
    Average: COLORS.warning,
    Adequate: COLORS.warning,
    TeamPlayer: COLORS.warning,
    
    High: COLORS.success,
    Senior: COLORS.success,
    Strong: COLORS.success,
    Exceptional: COLORS.success,
    Excellent: COLORS.success,
    Leader: COLORS.success,
    FastLearner: COLORS.success
  };

  const terms = Object.entries(variable.terms);
  
  // First draw shading so lines sit on top
  terms.forEach(([termName, mf], idx) => {
    const color = termColors[termName] || COLORS.primary;
    const points = mf.getPoints(variable.min, variable.max, 60);
    
    // Draw shaded polygon
    let pathData = `M ${mapX(variable.min)} ${mapY(0)} `;
    points.forEach(p => {
      pathData += `L ${mapX(p.x)} ${mapY(p.y)} `;
    });
    pathData += `L ${mapX(variable.max)} ${mapY(0)} Z`;

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "path");
    poly.setAttribute("d", pathData);
    poly.setAttribute("fill", color);
    poly.setAttribute("fill-opacity", "0.03");
    svg.appendChild(poly);

    // If active, shade the intersection
    const activation = mf.evaluate(crispValue);
    if (activation > 0) {
      let activePathData = `M ${mapX(variable.min)} ${mapY(0)} `;
      points.forEach(p => {
        const clippedY = Math.min(p.y, activation);
        activePathData += `L ${mapX(p.x)} ${mapY(clippedY)} `;
      });
      activePathData += `L ${mapX(variable.max)} ${mapY(0)} Z`;

      const activePoly = document.createElementNS("http://www.w3.org/2000/svg", "path");
      activePoly.setAttribute("d", activePathData);
      activePoly.setAttribute("fill", color);
      activePoly.setAttribute("fill-opacity", "0.22");
      svg.appendChild(activePoly);
    }
  });

  // Then draw curve lines and labels
  terms.forEach(([termName, mf], idx) => {
    const color = termColors[termName] || COLORS.primary;
    const points = mf.getPoints(variable.min, variable.max, 60);

    let pathData = "";
    points.forEach((p, i) => {
      pathData += `${i === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)} `;
    });

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", pathData);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "2.2");
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    // Draw text label on peak
    const peakX = mf.b !== undefined ? mf.b : (mf.b + mf.c) / 2; // Midpoint for trapezoid core
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", mapX(peakX));
    label.setAttribute("y", mapY(1.05) - 4);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", color);
    label.style.fontFamily = "Inter, sans-serif";
    label.style.fontWeight = "bold";
    label.style.fontSize = "10px";
    label.textContent = termName;
    svg.appendChild(label);
  });

  // 3. Draw Crisp Value Marker Line
  const cx = mapX(crispValue);
  
  const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  vLine.setAttribute("x1", cx);
  vLine.setAttribute("y1", mapY(1.05));
  vLine.setAttribute("x2", cx);
  vLine.setAttribute("y2", mapY(0));
  vLine.setAttribute("stroke", COLORS.textLight);
  vLine.setAttribute("stroke-width", "2");
  vLine.setAttribute("stroke-dasharray", "4,4");
  vLine.setAttribute("filter", "drop-shadow(0px 0px 4px rgba(255,255,255,0.4))");
  svg.appendChild(vLine);

  // Circle marker on the crisp line
  const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  handle.setAttribute("cx", cx);
  handle.setAttribute("cy", mapY(0));
  handle.setAttribute("r", "4");
  handle.setAttribute("fill", COLORS.textLight);
  svg.appendChild(handle);

  // Floating label showing the crisp input value
  const valLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  valLabel.setAttribute("x", cx);
  valLabel.setAttribute("y", padding.top - 8);
  valLabel.setAttribute("text-anchor", "middle");
  valLabel.setAttribute("fill", COLORS.textLight);
  valLabel.style.fontFamily = "Inter, sans-serif";
  valLabel.style.fontSize = "11px";
  valLabel.style.fontWeight = "bold";
  valLabel.textContent = crispValue.toFixed(1);
  svg.appendChild(valLabel);

  container.appendChild(svg);
}

/**
 * Draws the aggregated output fuzzy set and the defuzzified centroid line.
 */
function drawDefuzzificationShape(containerId, variable, aggregatedShape, centroidValue, termMaxActivations) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = 180;
  const padding = { top: 25, right: 20, bottom: 30, left: 35 };

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.overflow = "visible";

  const mapX = (x) => padding.left + ((x - variable.min) / (variable.max - variable.min)) * (width - padding.left - padding.right);
  const mapY = (y) => height - padding.bottom - y * (height - padding.top - padding.bottom);

  // 1. Draw Grid Lines
  [0, 0.5, 1.0].forEach(yVal => {
    const y = mapY(yVal);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", COLORS.grid);
    line.setAttribute("stroke-width", "0.5");
    line.setAttribute("stroke-dasharray", "3,3");
    svg.appendChild(line);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", padding.left - 8);
    txt.setAttribute("y", y + 4);
    txt.setAttribute("text-anchor", "end");
    txt.setAttribute("fill", COLORS.textDark);
    txt.style.fontFamily = "Inter, sans-serif";
    txt.style.fontSize = "10px";
    txt.textContent = yVal.toFixed(1);
    svg.appendChild(txt);
  });

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const xVal = variable.min + (i / steps) * (variable.max - variable.min);
    const x = mapX(xVal);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", x);
    txt.setAttribute("y", height - 10);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("fill", COLORS.textDark);
    txt.style.fontFamily = "Inter, sans-serif";
    txt.style.fontSize = "10px";
    txt.textContent = xVal.toFixed(0) + "%";
    svg.appendChild(txt);
  }

  // 2. Draw Aggregated Mamdani shape
  if (aggregatedShape && aggregatedShape.length > 0) {
    let pathData = `M ${mapX(variable.min)} ${mapY(0)} `;
    aggregatedShape.forEach(p => {
      pathData += `L ${mapX(p.x)} ${mapY(p.y)} `;
    });
    pathData += `L ${mapX(variable.max)} ${mapY(0)} Z`;

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    polygon.setAttribute("d", pathData);
    polygon.setAttribute("fill", "url(#aggregatedGradient)");
    polygon.setAttribute("stroke", COLORS.primary);
    polygon.setAttribute("stroke-width", "1.5");
    svg.appendChild(polygon);

    // Setup Gradient Definitions
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "aggregatedGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", COLORS.danger);
    stop1.setAttribute("stop-opacity", "0.4");
    
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", COLORS.warning);
    stop2.setAttribute("stop-opacity", "0.4");

    const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", COLORS.success);
    stop3.setAttribute("stop-opacity", "0.4");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    svg.appendChild(defs);
  }

  // 3. Draw Centroid Line
  const cx = mapX(centroidValue);
  const cLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  cLine.setAttribute("x1", cx);
  cLine.setAttribute("y1", mapY(1.1));
  cLine.setAttribute("x2", cx);
  cLine.setAttribute("y2", mapY(0));
  cLine.setAttribute("stroke", COLORS.primary);
  cLine.setAttribute("stroke-width", "3");
  svg.appendChild(cLine);

  // Glowing center dot
  const centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerDot.setAttribute("cx", cx);
  centerDot.setAttribute("cy", mapY(centroidValue / 100)); // Map height approximately
  centerDot.setAttribute("r", "5");
  centerDot.setAttribute("fill", COLORS.primary);
  centerDot.setAttribute("filter", "drop-shadow(0px 0px 4px #6366f1)");
  svg.appendChild(centerDot);

  // Display value at the top
  const titleTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
  titleTxt.setAttribute("x", cx);
  titleTxt.setAttribute("y", padding.top - 8);
  titleTxt.setAttribute("text-anchor", "middle");
  titleTxt.setAttribute("fill", COLORS.textLight);
  titleTxt.style.fontFamily = "Inter, sans-serif";
  titleTxt.style.fontSize = "12px";
  titleTxt.style.fontWeight = "bold";
  titleTxt.textContent = `Score Centroid: ${centroidValue.toFixed(1)}%`;
  svg.appendChild(titleTxt);

  container.appendChild(svg);
}

/**
 * Draws a beautiful SHAP-style force plot.
 * Explains criteria contribution to deviation from the baseline average.
 */
function drawSHAPForcePlot(containerId, contributions, baseValue, finalValue) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = 90;
  const padding = { left: 15, right: 15 };

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.overflow = "visible";

  const minRange = 0;
  const maxRange = 100;
  
  const mapX = (val) => padding.left + ((val - minRange) / (maxRange - minRange)) * (width - padding.left - padding.right);

  // Draw background scale line
  const bgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  bgLine.setAttribute("x1", padding.left);
  bgLine.setAttribute("y1", height / 2 + 10);
  bgLine.setAttribute("x2", width - padding.right);
  bgLine.setAttribute("y2", height / 2 + 10);
  bgLine.setAttribute("stroke", COLORS.grid);
  bgLine.setAttribute("stroke-width", "2");
  svg.appendChild(bgLine);

  // Base Value Marker
  const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  baseLine.setAttribute("x1", mapX(baseValue));
  baseLine.setAttribute("y1", 10);
  baseLine.setAttribute("x2", mapX(baseValue));
  baseLine.setAttribute("y2", height - 10);
  baseLine.setAttribute("stroke", COLORS.textDark);
  baseLine.setAttribute("stroke-width", "1");
  baseLine.setAttribute("stroke-dasharray", "2,2");
  svg.appendChild(baseLine);

  const baseLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  baseLabel.setAttribute("x", mapX(baseValue));
  baseLabel.setAttribute("y", 12);
  baseLabel.setAttribute("text-anchor", "middle");
  baseLabel.setAttribute("fill", COLORS.textDark);
  baseLabel.style.fontSize = "9px";
  baseLabel.textContent = `Baseline (${baseValue.toFixed(0)})`;
  svg.appendChild(baseLabel);

  // Calculate coordinates for force vectors
  let currentPos = baseValue;
  
  // Sort contributions so positive ones go first, then negative ones
  const activeContribs = Object.entries(contributions)
    .filter(([_, val]) => Math.abs(val) > 0.1)
    .map(([key, val]) => ({ name: key, val: val }))
    .sort((a, b) => b.val - a.val);

  let rightAccum = baseValue;
  let leftAccum = baseValue;

  const barY = height / 2 + 2;
  const barHeight = 16;

  activeContribs.forEach((contrib) => {
    let startX, endX, fill;
    
    if (contrib.val > 0) {
      startX = mapX(rightAccum);
      rightAccum += contrib.val;
      endX = mapX(rightAccum);
      fill = `url(#shapPositiveGrad)`;
    } else {
      startX = mapX(leftAccum);
      leftAccum += contrib.val; // Subtract negative
      endX = mapX(leftAccum);
      fill = `url(#shapNegativeGrad)`;
    }

    // Draw the push bar segment
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", Math.min(startX, endX));
    rect.setAttribute("y", barY);
    rect.setAttribute("width", Math.abs(startX - endX));
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", fill);
    rect.setAttribute("rx", "2");

    // Add interactive tooltip
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${contrib.name}: ${contrib.val > 0 ? '+' : ''}${contrib.val.toFixed(1)}%`;
    rect.appendChild(title);
    svg.appendChild(rect);

    // Label above/below the block
    const labelX = (startX + endX) / 2;
    const isPos = contrib.val > 0;
    const textY = isPos ? barY - 4 : barY + barHeight + 12;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", labelX);
    text.setAttribute("y", textY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", isPos ? COLORS.success : COLORS.danger);
    text.style.fontSize = "9px";
    text.style.fontWeight = "bold";
    text.style.fontFamily = "Inter, sans-serif";
    
    // Capitalize first letter of variable name
    const prettyName = contrib.name.charAt(0).toUpperCase() + contrib.name.slice(1);
    text.textContent = `${prettyName} (${contrib.val > 0 ? '+' : ''}${contrib.val.toFixed(0)})`;
    svg.appendChild(text);
  });

  // Final Score Indicator
  const finalX = mapX(finalValue);
  const pointer = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  pointer.setAttribute("points", `${finalX},${barY - 8} ${finalX - 6},${barY - 14} ${finalX + 6},${barY - 14}`);
  pointer.setAttribute("fill", COLORS.primary);
  svg.appendChild(pointer);

  const finalLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  finalLabel.setAttribute("x", finalX);
  finalLabel.setAttribute("y", barY - 18);
  finalLabel.setAttribute("text-anchor", "middle");
  finalLabel.setAttribute("fill", COLORS.textLight);
  finalLabel.style.fontSize = "12px";
  finalLabel.style.fontWeight = "bold";
  finalLabel.style.fontFamily = "Inter, sans-serif";
  finalLabel.textContent = `Score: ${finalValue.toFixed(1)}%`;
  svg.appendChild(finalLabel);

  // Setup gradient markers
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  
  const posGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  posGrad.setAttribute("id", "shapPositiveGrad");
  posGrad.innerHTML = `<stop offset="0%" stop-color="#10b981" stop-opacity="0.85" /><stop offset="100%" stop-color="#6366f1" stop-opacity="0.85" />`;
  
  const negGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  negGrad.setAttribute("id", "shapNegativeGrad");
  negGrad.innerHTML = `<stop offset="0%" stop-color="#f43f5e" stop-opacity="0.85" /><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.85" />`;

  defs.appendChild(posGrad);
  defs.appendChild(negGrad);
  svg.appendChild(defs);

  container.appendChild(svg);
}

/**
 * Renders rule activation blocks highlighting exact triggered rules.
 */
function renderRuleBaseMap(containerId, ruleActivations) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Sort rules: active ones on top, sorted by activation strength
  const sortedRules = [...ruleActivations].sort((a, b) => b.activation - a.activation);

  sortedRules.forEach(act => {
    const card = document.createElement("div");
    card.className = `rule-card p-3 mb-2 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center transition-all ${
      act.activation > 0 
        ? "bg-slate-800/60 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.15)]" 
        : "bg-slate-900/20 border-slate-800 opacity-40 hover:opacity-70"
    }`;

    // Left block: Antecedent formula
    const formula = document.createElement("div");
    formula.className = "flex-1 mr-3 text-xs md:text-sm";
    
    const labelIf = document.createElement("span");
    labelIf.className = "text-indigo-400 font-bold mr-1";
    labelIf.textContent = "IF";
    formula.appendChild(labelIf);

    // Format antecedent tree description
    const antDesc = formatAntecedent(act.antecedent);
    const formulaText = document.createElement("span");
    formulaText.className = "text-slate-300";
    formulaText.innerHTML = antDesc;
    formula.appendChild(formulaText);

    const labelThen = document.createElement("span");
    labelThen.className = "text-indigo-400 font-bold mx-1";
    labelThen.textContent = "THEN";
    formula.appendChild(labelThen);

    const consequent = document.createElement("span");
    consequent.className = "text-violet-400 font-bold";
    consequent.textContent = `${act.consequentVar} IS ${act.consequentTerm}`;
    formula.appendChild(consequent);

    card.appendChild(formula);

    // Right block: Activation status & progress
    const activePanel = document.createElement("div");
    activePanel.className = "w-full md:w-32 mt-2 md:mt-0 flex items-center justify-between";

    const valueTxt = document.createElement("span");
    valueTxt.className = `text-xs font-mono font-bold mr-2 ${act.activation > 0 ? "text-emerald-400" : "text-slate-500"}`;
    valueTxt.textContent = `μ = ${act.activation.toFixed(2)}`;
    activePanel.appendChild(valueTxt);

    const barBg = document.createElement("div");
    barBg.className = "h-1.5 flex-1 bg-slate-700/60 rounded-full overflow-hidden";
    
    const barFill = document.createElement("div");
    barFill.className = `h-full rounded-full transition-all duration-300 ${act.activation > 0 ? "bg-emerald-400" : "bg-slate-600"}`;
    barFill.style.width = `${act.activation * 100}%`;
    
    barBg.appendChild(barFill);
    activePanel.appendChild(barBg);

    card.appendChild(activePanel);
    container.appendChild(card);
  });
}

function formatAntecedent(node) {
  if (!node) return "";
  
  if (node.var && node.term) {
    const notStr = node.not ? "NOT " : "";
    return `<span class="text-slate-100 font-medium">${notStr}${node.var}</span> is <span class="text-indigo-300 font-medium">${node.term}</span>`;
  }
  
  if (node.type === 'AND' || node.type === 'OR') {
    const opColor = node.type === 'AND' ? 'text-amber-500' : 'text-cyan-500';
    return `${formatAntecedent(node.left)} <span class="${opColor} font-bold mx-1">${node.type}</span> ${formatAntecedent(node.right)}`;
  }
  
  return "";
}

// --- Bind to window/exports ---
const XAIVisualizer = {
  drawMembershipCurves,
  drawDefuzzificationShape,
  drawSHAPForcePlot,
  renderRuleBaseMap
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = XAIVisualizer;
} else {
  window.XAIVisualizer = XAIVisualizer;
}
