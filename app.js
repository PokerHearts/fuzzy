/**
 * FuzzyXAI Main Application Controller
 * Sets up the Fuzzy Inference Systems (FIS), manages the state, binds user events,
 * performs keyword resume extraction, calculates cosine alignment metrics, and 
 * drives the Explainable AI (XAI) rendering updates.
 */

// Import classes if node/testing environment, otherwise use globals
const FIS = typeof window !== 'undefined' ? window.FuzzyEngine : require('./fuzzyEngine.js');
const DataModels = typeof window !== 'undefined' ? window.HRData : require('./data.js');

// --- Global Application State ---
const appState = {
  currentTab: 'screener',
  screener: {
    selectedJD: 'frontend_architect',
    selectedCandidate: 'candidate_1',
    weights: { skills: 1.0, experience: 1.0, alignment: 0.8, culture: 0.8, education: 0.6 },
    inputs: { skills: 80, experience: 9, alignment: 75, culture: 80, education: 85 },
    customResume: false
  },
  performance: {
    selectedEmployee: 'emp_101',
    weights: { prod: 1.0, qual: 1.0, coll: 0.8, adap: 0.7, auto: 0.6 },
    inputs: { prod: 92, qual: 94, coll: 95, adap: 88, auto: 90 }
  },
  nexus: {
    selectedRestaurant: 'restaurant_1',
    targetCuisine: 'Italian',
    targetDistance: 3.0,
    likert: {
      dist: { imp: 3, urg: 2, nec: 4 },
      cui: { imp: 4, urg: 1, nec: 3 },
      rev: { imp: 5, urg: 3, nec: 4 }
    },
    customRestaurantsList: [],
    customReviews: false
  }
};

// --- Fuzzy System Configurations ---
let screenerFIS;
let performanceFIS;

function initializeFuzzySystems() {
  // ==========================================
  // 1. CANDIDATE SCREENING SYSTEM
  // ==========================================
  screenerFIS = new FIS.FuzzySystem();

  // Variables
  const varSkills = new FIS.FuzzyVariable('skills', 0, 100);
  varSkills.addTerm('Low', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varSkills.addTerm('Medium', new FIS.TriangularMF(30, 50, 70));
  varSkills.addTerm('High', new FIS.TrapezoidalMF(50, 80, 100, 100));

  const varExp = new FIS.FuzzyVariable('experience', 0, 15);
  varExp.addTerm('Junior', new FIS.TrapezoidalMF(0, 0, 2, 5));
  varExp.addTerm('Mid', new FIS.TriangularMF(3, 6, 9));
  varExp.addTerm('Senior', new FIS.TrapezoidalMF(7, 10, 15, 15));

  const varAlign = new FIS.FuzzyVariable('alignment', 0, 100);
  varAlign.addTerm('Weak', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varAlign.addTerm('Moderate', new FIS.TriangularMF(35, 55, 75));
  varAlign.addTerm('Strong', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varCulture = new FIS.FuzzyVariable('culture', 0, 100);
  varCulture.addTerm('Poor', new FIS.TrapezoidalMF(0, 0, 25, 50));
  varCulture.addTerm('Average', new FIS.TriangularMF(35, 55, 75));
  varCulture.addTerm('Excellent', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varEdu = new FIS.FuzzyVariable('education', 0, 100);
  varEdu.addTerm('Basic', new FIS.TrapezoidalMF(0, 0, 30, 55));
  varEdu.addTerm('Adequate', new FIS.TriangularMF(40, 60, 80));
  varEdu.addTerm('Exceptional', new FIS.TrapezoidalMF(65, 85, 100, 100));

  const varFit = new FIS.FuzzyVariable('fit', 0, 100, true);
  varFit.addTerm('Poor', new FIS.TrapezoidalMF(0, 0, 25, 45));
  varFit.addTerm('Average', new FIS.TriangularMF(35, 50, 70));
  varFit.addTerm('Exceptional', new FIS.TrapezoidalMF(60, 80, 100, 100));

  screenerFIS.addVariable(varSkills).addVariable(varExp).addVariable(varAlign)
             .addVariable(varCulture).addVariable(varEdu).addVariable(varFit);

  // Mamdani Rules (Dynamic weights will be applied later)
  // Standard gold standard match
  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'High' },
      right: {
        type: 'AND',
        left: { var: 'experience', term: 'Senior' },
        right: { var: 'alignment', term: 'Strong' }
      }
    },
    'fit', 'Exceptional'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'OR',
      left: { var: 'skills', term: 'Low' },
      right: { var: 'culture', term: 'Poor' }
    },
    'fit', 'Poor'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'Medium' },
      right: { var: 'experience', term: 'Mid' }
    },
    'fit', 'Average'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'High' },
      right: { var: 'culture', term: 'Excellent' }
    },
    'fit', 'Exceptional'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'alignment', term: 'Strong' },
      right: { var: 'experience', term: 'Senior' }
    },
    'fit', 'Exceptional'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'Low' },
      right: { var: 'experience', term: 'Junior' }
    },
    'fit', 'Poor'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'Medium' },
      right: { var: 'culture', term: 'Average' }
    },
    'fit', 'Average'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'skills', term: 'High' },
      right: { var: 'experience', term: 'Junior' }
    },
    'fit', 'Average'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'education', term: 'Exceptional' },
      right: { var: 'skills', term: 'High' }
    },
    'fit', 'Exceptional'
  ));

  screenerFIS.addRule(new FIS.FuzzyRule(
    { var: 'culture', term: 'Poor' },
    'fit', 'Poor'
  ));


  // ==========================================
  // 2. EMPLOYEE PERFORMANCE EVALUATION SYSTEM
  // ==========================================
  performanceFIS = new FIS.FuzzySystem();

  const varProd = new FIS.FuzzyVariable('prod', 0, 100);
  varProd.addTerm('Low', new FIS.TrapezoidalMF(0, 0, 20, 45));
  varProd.addTerm('Average', new FIS.TriangularMF(30, 50, 70));
  varProd.addTerm('High', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varQual = new FIS.FuzzyVariable('qual', 0, 100);
  varQual.addTerm('NeedsImprovement', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varQual.addTerm('MeetsExpectations', new FIS.TriangularMF(35, 55, 75));
  varQual.addTerm('Outstanding', new FIS.TrapezoidalMF(65, 80, 100, 100));

  const varColl = new FIS.FuzzyVariable('coll', 0, 100);
  varColl.addTerm('Individualist', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varColl.addTerm('TeamPlayer', new FIS.TriangularMF(35, 55, 75));
  varColl.addTerm('Leader', new FIS.TrapezoidalMF(65, 80, 100, 100));

  const varAdap = new FIS.FuzzyVariable('adap', 0, 100);
  varAdap.addTerm('Slow', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varAdap.addTerm('Adaptive', new FIS.TriangularMF(35, 55, 75));
  varAdap.addTerm('FastLearner', new FIS.TrapezoidalMF(65, 80, 100, 100));

  const varAuto = new FIS.FuzzyVariable('auto', 0, 100);
  varAuto.addTerm('Low', new FIS.TrapezoidalMF(0, 0, 25, 50));
  varAuto.addTerm('Moderate', new FIS.TriangularMF(35, 55, 75));
  varAuto.addTerm('High', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varPerf = new FIS.FuzzyVariable('performance', 0, 100, true);
  varPerf.addTerm('Critical', new FIS.TrapezoidalMF(0, 0, 20, 45));
  varPerf.addTerm('GrowthNeeded', new FIS.TriangularMF(35, 50, 65));
  varPerf.addTerm('Solid', new FIS.TriangularMF(55, 70, 85));
  varPerf.addTerm('Star', new FIS.TrapezoidalMF(75, 90, 100, 100));

  performanceFIS.addVariable(varProd).addVariable(varQual).addVariable(varColl)
                 .addVariable(varAdap).addVariable(varAuto).addVariable(varPerf);

  // Performance Evaluation Rules
  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'prod', term: 'High' },
      right: { var: 'qual', term: 'Outstanding' }
    },
    'performance', 'Star'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'OR',
      left: { var: 'prod', term: 'Low' },
      right: { var: 'qual', term: 'NeedsImprovement' }
    },
    'performance', 'Critical'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'coll', term: 'Leader' },
      right: { var: 'auto', term: 'High' }
    },
    'performance', 'Star'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'prod', term: 'Average' },
      right: { var: 'qual', term: 'MeetsExpectations' }
    },
    'performance', 'Solid'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'adap', term: 'FastLearner' },
      right: { var: 'qual', term: 'Outstanding' }
    },
    'performance', 'Star'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'coll', term: 'Individualist' },
      right: { var: 'prod', term: 'Low' }
    },
    'performance', 'GrowthNeeded'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'prod', term: 'Average' },
      right: { var: 'auto', term: 'Low' }
    },
    'performance', 'GrowthNeeded'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'prod', term: 'High' },
      right: { var: 'qual', term: 'MeetsExpectations' }
    },
    'performance', 'Solid'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'coll', term: 'TeamPlayer' },
      right: { var: 'qual', term: 'MeetsExpectations' }
    },
    'performance', 'Solid'
  ));

  performanceFIS.addRule(new FIS.FuzzyRule(
    { var: 'qual', term: 'NeedsImprovement' },
    'performance', 'Critical'
  ));

  // ==========================================
  // 3. DECISION NEXUS (LINKS & RESTAURANTS) SYSTEM
  // ==========================================
  nexusFIS = new FIS.FuzzySystem();

  const varDist = new FIS.FuzzyVariable('distanceFit', 0, 100);
  varDist.addTerm('Far', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varDist.addTerm('Moderate', new FIS.TriangularMF(35, 55, 75));
  varDist.addTerm('Near', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varCuisine = new FIS.FuzzyVariable('cuisineFit', 0, 100);
  varCuisine.addTerm('Dislike', new FIS.TrapezoidalMF(0, 0, 20, 45));
  varCuisine.addTerm('Partial', new FIS.TriangularMF(35, 55, 75));
  varCuisine.addTerm('Perfect', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varSentiment = new FIS.FuzzyVariable('reviewsSentiment', 0, 100);
  varSentiment.addTerm('Poor', new FIS.TrapezoidalMF(0, 0, 20, 50));
  varSentiment.addTerm('Good', new FIS.TriangularMF(35, 55, 75));
  varSentiment.addTerm('Excellent', new FIS.TrapezoidalMF(60, 80, 100, 100));

  const varMatch = new FIS.FuzzyVariable('matchScore', 0, 100, true);
  varMatch.addTerm('Poor', new FIS.TrapezoidalMF(0, 0, 25, 45));
  varMatch.addTerm('Average', new FIS.TriangularMF(35, 50, 70));
  varMatch.addTerm('Exceptional', new FIS.TrapezoidalMF(60, 80, 100, 100));

  nexusFIS.addVariable(varDist).addVariable(varCuisine).addVariable(varSentiment).addVariable(varMatch);

  // Mamdani rules for Nexus
  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'distanceFit', term: 'Near' },
      right: { var: 'reviewsSentiment', term: 'Excellent' }
    },
    'matchScore', 'Exceptional'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    { var: 'reviewsSentiment', term: 'Poor' },
    'matchScore', 'Poor'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    { var: 'distanceFit', term: 'Far' },
    'matchScore', 'Poor'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'cuisineFit', term: 'Perfect' },
      right: { var: 'reviewsSentiment', term: 'Excellent' }
    },
    'matchScore', 'Exceptional'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'distanceFit', term: 'Moderate' },
      right: { var: 'reviewsSentiment', term: 'Good' }
    },
    'matchScore', 'Average'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'cuisineFit', term: 'Perfect' },
      right: { var: 'distanceFit', term: 'Near' }
    },
    'matchScore', 'Exceptional'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    { var: 'cuisineFit', term: 'Dislike' },
    'matchScore', 'Poor'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'reviewsSentiment', term: 'Good' },
      right: { var: 'distanceFit', term: 'Near' }
    },
    'matchScore', 'Exceptional'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'AND',
      left: { var: 'distanceFit', term: 'Moderate' },
      right: { var: 'reviewsSentiment', term: 'Excellent' }
    },
    'matchScore', 'Exceptional'
  ));

  nexusFIS.addRule(new FIS.FuzzyRule(
    {
      type: 'OR',
      left: { var: 'reviewsSentiment', term: 'Poor' },
      right: { var: 'distanceFit', term: 'Far' }
    },
    'matchScore', 'Poor'
  ));
}

// --- Dynamic Weights Updates ---

function applyRulesWeights(fis, weightsMapping) {
  // Adjusts the activation weight of rules depending on the importance factors.
  // We match rule consequents or antecedents and scale their weight.
  fis.rules.forEach(rule => {
    // If the antecedent contains a variable, scale the rule weight by that variable's weight
    let weight = 1.0;
    
    // Recursive tracker for variables
    const getWeights = (node) => {
      if (!node) return [];
      if (node.var) return [weightsMapping[node.var] || 1.0];
      return [...getWeights(node.left), ...getWeights(node.right)];
    };
    
    const nodeWeights = getWeights(rule.antecedent);
    if (nodeWeights.length > 0) {
      // Rule weight is evaluated as the average weight of its triggers
      weight = nodeWeights.reduce((a, b) => a + b, 0) / nodeWeights.length;
    }
    
    rule.weight = weight;
  });
}

// --- SHAP Real-time Force Plot Solver ---

/**
 * Calculates local marginal feature contributions (SHAP-like).
 * Measures score shift when setting each feature to its baseline middle.
 */
function calculateSHAPContributions(fis, currentInputs, baselineValue) {
  const contributions = {};
  const variables = Object.values(fis.variables).filter(v => !v.isOutput);
  
  // Get current final score
  const finalResult = fis.solve(currentInputs);
  const outputVar = Object.keys(finalResult.outputs)[0];
  const finalScore = finalResult.outputs[outputVar];

  // For each variable, set its input to 50% midpoint of its range and re-solve
  variables.forEach(variable => {
    const midValue = (variable.max + variable.min) / 2;
    const modifiedInputs = { ...currentInputs };
    modifiedInputs[variable.name] = midValue;

    const modResult = fis.solve(modifiedInputs);
    const modScore = modResult.outputs[outputVar];

    // Contribution = current score - modified score (isolated marginal difference)
    contributions[variable.name] = finalScore - modScore;
  });

  return contributions;
}

// --- Tab Swapper ---
function switchTab(tabId) {
  appState.currentTab = tabId;

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (tabId === 'screener') {
    document.getElementById('nav-screener').classList.add('active');
    document.getElementById('tab-screener').classList.add('active');
    document.getElementById('view-title').textContent = "Resume Screening & Fit Evaluation";
    document.getElementById('view-desc').textContent = "Fuzzy Multi-Criteria Decision Support Engine aligned with Top Performer profiles.";
    updateScreenerView();
  } else if (tabId === 'performance') {
    document.getElementById('nav-performance').classList.add('active');
    document.getElementById('tab-performance').classList.add('active');
    document.getElementById('view-title').textContent = "Performance Analytics & Talent Grid";
    document.getElementById('view-desc').textContent = "Explainable evaluation of core indicators for promotion readiness and retention alert.";
    updatePerformanceView();
  } else if (tabId === 'nexus') {
    document.getElementById('nav-nexus').classList.add('active');
    document.getElementById('tab-nexus').classList.add('active');
    document.getElementById('view-title').textContent = "Decision Nexus: Resource & Link Evaluator";
    document.getElementById('view-desc').textContent = "Explainable Multi-Criteria Recommendation System based on Distance, Cuisine, and Scraped Reviews.";
    updateNexusView();
  }
}

// --- UI Dynamic Rendering & Controller ---

// Screen Initializer
function updateScreenerView() {
  const inputs = appState.screener.inputs;
  const weights = appState.screener.weights;
  
  // Apply Rule Weights
  applyRulesWeights(screenerFIS, weights);

  // Solve fuzzy system
  const solveResult = screenerFIS.solve(inputs);
  const finalFit = solveResult.outputs.fit;
  const explanations = solveResult.explanations;

  // 1. Render Final Badges & Texts
  document.getElementById('final-score-val').textContent = `${finalFit.toFixed(1)}%`;
  
  const badge = document.getElementById('final-decision-badge');
  const desc = document.getElementById('decision-desc');
  
  badge.className = "score-badge ";
  if (finalFit >= 72) {
    badge.textContent = "Exceptional Fit";
    badge.classList.add("high");
    desc.textContent = "Strong recommendation. Profile aligns highly with skills and historical employee benchmarks. Ready to hire.";
  } else if (finalFit >= 45) {
    badge.textContent = "Average Match";
    badge.classList.add("mid");
    desc.textContent = "Moderate recommendation. Possesses required basics but has soft skill or experience gaps. Schedule screening call.";
  } else {
    badge.textContent = "Poor Alignment";
    badge.classList.add("low");
    desc.textContent = "High risks. Gaps across primary criteria. Profile significantly deviates from required role baseline. Reject candidate.";
  }

  // 2. Render Slider Values
  document.getElementById('val-skills').textContent = `${inputs.skills.toFixed(0)}%`;
  document.getElementById('val-experience').textContent = `${inputs.experience.toFixed(1)} Years`;
  document.getElementById('val-alignment').textContent = `${inputs.alignment.toFixed(0)}%`;
  document.getElementById('val-culture').textContent = `${inputs.culture.toFixed(0)}%`;
  
  const eduLabels = { 20: "None", 40: "Associate", 60: "Bachelor", 85: "Master", 100: "PhD" };
  // Find closest label
  let closestEdu = 20;
  Object.keys(eduLabels).forEach(k => {
    if (Math.abs(inputs.education - k) < Math.abs(inputs.education - closestEdu)) {
      closestEdu = parseInt(k);
    }
  });
  document.getElementById('val-education').textContent = eduLabels[closestEdu];

  // 3. Render XAI SVG Graphics
  // SHAP waterfall plot
  const baselineScreener = 55; // Expected mid-fit score
  const contributions = calculateSHAPContributions(screenerFIS, inputs, baselineScreener);
  window.XAIVisualizer.drawSHAPForcePlot('shap-plot-screener', contributions, baselineScreener, finalFit);

  // Defuzzification shape
  window.XAIVisualizer.drawDefuzzificationShape(
    'centroid-plot-screener', 
    screenerFIS.variables.fit, 
    explanations.aggregatedOutputShape, 
    finalFit, 
    explanations.termMaxActivations
  );

  // Active Variable Memberships
  window.XAIVisualizer.drawMembershipCurves('mf-skills', screenerFIS.variables.skills, inputs.skills);
  window.XAIVisualizer.drawMembershipCurves('mf-experience', screenerFIS.variables.experience, inputs.experience);
  window.XAIVisualizer.drawMembershipCurves('mf-alignment', screenerFIS.variables.alignment, inputs.alignment);
  window.XAIVisualizer.drawMembershipCurves('mf-culture', screenerFIS.variables.culture, inputs.culture);

  // Rule activation inspector list
  window.XAIVisualizer.renderRuleBaseMap('rules-list-screener', explanations.ruleActivations);
}

function updatePerformanceView() {
  const inputs = appState.performance.inputs;
  const weights = appState.performance.weights;

  // Apply Weights
  applyRulesWeights(performanceFIS, weights);

  // Solve
  const solveResult = performanceFIS.solve(inputs);
  const finalPerf = solveResult.outputs.performance;
  const explanations = solveResult.explanations;

  // 1. Render Final Badges & Recommendations
  document.getElementById('perf-score-val').textContent = `${finalPerf.toFixed(1)}%`;
  
  const badge = document.getElementById('perf-decision-badge');
  const desc = document.getElementById('perf-decision-desc');
  
  badge.className = "score-badge ";
  if (finalPerf >= 75) {
    badge.textContent = "Star Performer";
    badge.classList.add("high");
    desc.textContent = "Exceptional results. High retention priority. Fast-track for promotion and leadership pipelines.";
  } else if (finalPerf >= 55) {
    badge.textContent = "Solid Contributor";
    badge.classList.add("high"); // Green-ish highlight
    desc.textContent = "Meets expectations fully. Solid asset. Provide continuous upskilling and clear growth goals.";
  } else if (finalPerf >= 35) {
    badge.textContent = "Growth Needed";
    badge.classList.add("mid");
    desc.textContent = "Noticeable gaps in throughput or quality. Recommend mentorship and tailored skills training.";
  } else {
    badge.textContent = "Critical Risk";
    badge.classList.add("low");
    desc.textContent = "Severe underperformance. Initiate formal improvement plan and review team dynamics.";
  }

  // 2. Render Slider Values
  document.getElementById('val-perf-prod').textContent = `${inputs.prod.toFixed(0)}%`;
  document.getElementById('val-perf-qual').textContent = `${inputs.qual.toFixed(0)}%`;
  document.getElementById('val-perf-coll').textContent = `${inputs.coll.toFixed(0)}%`;
  document.getElementById('val-perf-adap').textContent = `${inputs.adap.toFixed(0)}%`;
  document.getElementById('val-perf-auto').textContent = `${inputs.auto.toFixed(0)}%`;

  // 3. Render SVG Graphs
  const baselinePerf = 55;
  const contributions = calculateSHAPContributions(performanceFIS, inputs, baselinePerf);
  window.XAIVisualizer.drawSHAPForcePlot('shap-plot-perf', contributions, baselinePerf, finalPerf);

  window.XAIVisualizer.drawDefuzzificationShape(
    'centroid-plot-perf', 
    performanceFIS.variables.performance, 
    explanations.aggregatedOutputShape, 
    finalPerf, 
    explanations.termMaxActivations
  );

  window.XAIVisualizer.renderRuleBaseMap('rules-list-perf', explanations.ruleActivations);
}

// --- Data Binding Event Listeners ---

// Initialize JD Select options
function populateJDSelect() {
  const select = document.getElementById('jd-select');
  select.innerHTML = "";
  
  Object.values(DataModels.JOB_DESCRIPTIONS).forEach(jd => {
    const opt = document.createElement('option');
    opt.value = jd.id;
    opt.textContent = jd.title;
    select.appendChild(opt);
  });
}

function onJDChanged() {
  const select = document.getElementById('jd-select');
  appState.screener.selectedJD = select.value;
  
  const jd = DataModels.JOB_DESCRIPTIONS[select.value];
  
  // Render JD core skills badges
  const badges = document.getElementById('jd-skills-badges');
  badges.innerHTML = "";
  jd.skills.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge active";
    pill.textContent = s;
    badges.appendChild(pill);
  });

  // Re-evaluate current selected candidate on the new role JDs
  if (!appState.screener.customResume) {
    loadCandidate(appState.screener.selectedCandidate);
  } else {
    onCustomResumeInput();
  }
}

// Populates preloaded candidates list
function populateCandidatesList() {
  const list = document.getElementById('candidates-list');
  list.innerHTML = "";

  DataModels.CANDIDATES.forEach(cand => {
    const div = document.createElement('div');
    div.className = `candidate-item ${cand.id === appState.screener.selectedCandidate ? 'active' : ''}`;
    div.id = `cand-${cand.id}`;
    div.onclick = () => loadCandidate(cand.id);

    const info = document.createElement('div');
    info.className = "candidate-info";
    
    const name = document.createElement('h4');
    name.textContent = cand.name;
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.textContent = `Exp: ${cand.experience} yrs | Edu: ${cand.education}`;
    info.appendChild(desc);
    
    div.appendChild(info);

    // Initial mock evaluation indicators
    const badge = document.createElement('span');
    badge.className = "score-badge text-xs px-2 py-0.5 ";
    if (cand.id === 'candidate_1') {
      badge.textContent = "Exceptional";
      badge.classList.add("high");
    } else if (cand.id === 'candidate_2') {
      badge.textContent = "Average";
      badge.classList.add("mid");
    } else {
      badge.textContent = "Poor";
      badge.classList.add("low");
    }
    div.appendChild(badge);

    list.appendChild(div);
  });
}

function loadCandidate(candId) {
  appState.screener.customResume = false;
  appState.screener.selectedCandidate = candId;

  document.querySelectorAll('.candidate-item').forEach(item => item.classList.remove('active'));
  const activeCard = document.getElementById(`cand-${candId}`);
  if (activeCard) activeCard.classList.add('active');

  const cand = DataModels.CANDIDATES.find(c => c.id === candId);
  const jd = DataModels.JOB_DESCRIPTIONS[appState.screener.selectedJD];

  // Trigger semantic parsers
  const skillAnalysis = DataModels.parseResumeSkills(cand.resumeText, jd.skills);
  const benchmarkAlignment = DataModels.calculateHistoricalAlignment(skillAnalysis.matched, jd.id);
  const educationScore = DataModels.getEducationMatchScore(cand.education, jd.prefEducation);

  // Set Inputs
  appState.screener.inputs = {
    skills: skillAnalysis.percent,
    experience: cand.experience,
    alignment: benchmarkAlignment,
    culture: cand.collaboration * 0.4 + cand.adaptability * 0.4 + cand.leadership * 0.2, // Composite culture fit
    education: educationScore
  };

  // Populate Custom Resume text area
  document.getElementById('resume-text-input').value = cand.resumeText.trim();

  // Populate active candidate skills badges highlighting matches and gaps
  const badgeContainer = document.getElementById('candidate-skills-badges');
  badgeContainer.innerHTML = "";
  
  skillAnalysis.matched.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge active";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });
  
  skillAnalysis.missing.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge missing";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });

  // Sync Sliders
  document.getElementById('slide-skills').value = appState.screener.inputs.skills;
  document.getElementById('slide-experience').value = appState.screener.inputs.experience;
  document.getElementById('slide-alignment').value = appState.screener.inputs.alignment;
  document.getElementById('slide-culture').value = appState.screener.inputs.culture;
  document.getElementById('slide-education').value = appState.screener.inputs.education;

  updateScreenerView();
}

function onCustomResumeInput() {
  appState.screener.customResume = true;
  document.querySelectorAll('.candidate-item').forEach(item => item.classList.remove('active'));

  const text = document.getElementById('resume-text-input').value;
  const jd = DataModels.JOB_DESCRIPTIONS[appState.screener.selectedJD];

  const skillAnalysis = DataModels.parseResumeSkills(text, jd.skills);
  const alignment = DataModels.calculateHistoricalAlignment(skillAnalysis.matched, jd.id);
  
  // Extract experience heuristic from resume string
  let experience = 2; // Default baseline
  const expMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i) || text.match(/experience\s*:\s*(\d+)/i);
  if (expMatch && expMatch[1]) {
    experience = Math.min(15, parseInt(expMatch[1]));
  }

  // Education heuristic
  let education = 60; // Bachelor
  if (/ph\.?d|doctorate/i.test(text)) education = 100;
  else if (/master|m\.s\.|m\.tech/i.test(text)) education = 85;

  // Cultural heuristic
  let culture = 70; // Average
  if (/leadership|led|spearheaded/i.test(text)) culture += 10;
  if (/collaborate|team|agile/i.test(text)) culture += 10;
  culture = Math.min(100, culture);

  // Sync inputs
  appState.screener.inputs = {
    skills: skillAnalysis.percent,
    experience: experience,
    alignment: alignment,
    culture: culture,
    education: education
  };

  // Sync badges
  const badgeContainer = document.getElementById('candidate-skills-badges');
  badgeContainer.innerHTML = "";
  
  skillAnalysis.matched.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge active";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });
  
  skillAnalysis.missing.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge missing";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });

  // Sync Sliders
  document.getElementById('slide-skills').value = appState.screener.inputs.skills;
  document.getElementById('slide-experience').value = appState.screener.inputs.experience;
  document.getElementById('slide-alignment').value = appState.screener.inputs.alignment;
  document.getElementById('slide-culture').value = appState.screener.inputs.culture;
  document.getElementById('slide-education').value = appState.screener.inputs.education;

  updateScreenerView();
}

// Sandbox interactive sliders triggers
function onSliderAdjusted(type) {
  const slide = document.getElementById(`slide-${type}`);
  appState.screener.inputs[type] = parseFloat(slide.value);
  updateScreenerView();
}

// Recalculates rules weighting
function onWeightsChanged() {
  appState.screener.weights = {
    skills: parseFloat(document.getElementById('weight-skills').value),
    experience: parseFloat(document.getElementById('weight-experience').value),
    alignment: parseFloat(document.getElementById('weight-alignment').value),
    culture: parseFloat(document.getElementById('weight-culture').value),
    education: parseFloat(document.getElementById('weight-education').value)
  };
  updateScreenerView();
}

// ==========================================
// PERFORMANCE VIEW HANDLERS
// ==========================================

function populateEmployeesList() {
  const list = document.getElementById('employees-list');
  list.innerHTML = "";

  DataModels.EXISTING_EMPLOYEES.forEach(emp => {
    const div = document.createElement('div');
    div.className = `candidate-item ${emp.id === appState.performance.selectedEmployee ? 'active' : ''}`;
    div.id = `emp-${emp.id}`;
    div.onclick = () => loadEmployee(emp.id);

    const info = document.createElement('div');
    info.className = "candidate-info";
    
    const name = document.createElement('h4');
    name.textContent = emp.name;
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.textContent = `${emp.role} | Tenure: ${emp.tenure}`;
    info.appendChild(desc);
    
    div.appendChild(info);

    // Initial mock evaluation badges
    const badge = document.createElement('span');
    badge.className = "score-badge text-xs px-2 py-0.5 ";
    const score = (emp.productivity + emp.quality + emp.collaboration) / 3;
    if (score >= 85) {
      badge.textContent = "Star";
      badge.classList.add("high");
    } else if (score >= 60) {
      badge.textContent = "Solid";
      badge.classList.add("high");
    } else {
      badge.textContent = "Critical";
      badge.classList.add("low");
    }
    div.appendChild(badge);

    list.appendChild(div);
  });
}

function loadEmployee(empId) {
  appState.performance.selectedEmployee = empId;

  document.querySelectorAll('#employees-list .candidate-item').forEach(item => item.classList.remove('active'));
  const activeCard = document.getElementById(`emp-${empId}`);
  if (activeCard) activeCard.classList.add('active');

  const emp = DataModels.EXISTING_EMPLOYEES.find(e => e.id === empId);

  // Sync inputs
  appState.performance.inputs = {
    prod: emp.productivity,
    qual: emp.quality,
    coll: emp.collaboration,
    adap: emp.adaptability,
    auto: emp.autonomy
  };

  // Sync Sliders
  document.getElementById('slide-perf-prod').value = emp.productivity;
  document.getElementById('slide-perf-qual').value = emp.quality;
  document.getElementById('slide-perf-coll').value = emp.collaboration;
  document.getElementById('slide-perf-adap').value = emp.adaptability;
  document.getElementById('slide-perf-auto').value = emp.autonomy;

  updatePerformanceView();
}

function onPerfSliderAdjusted(type) {
  const slide = document.getElementById(`slide-perf-${type}`);
  appState.performance.inputs[type] = parseFloat(slide.value);
  updatePerformanceView();
}

function onPerfWeightsChanged() {
  appState.performance.weights = {
    prod: parseFloat(document.getElementById('weight-perf-prod').value),
    qual: parseFloat(document.getElementById('weight-perf-qual').value),
    coll: parseFloat(document.getElementById('weight-perf-coll').value),
    adap: parseFloat(document.getElementById('weight-perf-adap').value),
    auto: parseFloat(document.getElementById('weight-perf-auto').value)
  };
  updatePerformanceView();
}

// ==========================================
// 3. DECISION NEXUS (TAB 3) CONTROLLERS
// ==========================================

function updateNexusView() {
  const selectedRestId = appState.nexus.selectedRestaurant;
  const customRests = appState.nexus.customRestaurantsList;
  const preloadedRests = DataModels.RESTAURANTS;
  
  // Find current restaurant
  let r = customRests.find(item => item.id === selectedRestId) || preloadedRests.find(item => item.id === selectedRestId);
  if (!r) {
    if (preloadedRests.length > 0) r = preloadedRests[0];
    else return;
  }

  // 1. Calculate Fuzzy Inputs
  // distanceFit (0-100 score): 100 if actual <= target, decreases linearly beyond target
  const maxTargetDist = appState.nexus.targetDistance;
  const actualDist = r.distance;
  let distScore = 100;
  if (actualDist > maxTargetDist) {
    distScore = Math.max(10, 100 - (actualDist - maxTargetDist) * 15);
  }
  
  // cuisineFit (0-100 score): Perfect if match, Dislike if Italian vs Sushi
  const targetCuisine = appState.nexus.targetCuisine;
  let cuisineScore = 10;
  if (r.cuisine === targetCuisine) cuisineScore = 100;
  else if (
    (r.cuisine === 'Italian' && targetCuisine === 'Sushi') ||
    (r.cuisine === 'Sushi' && targetCuisine === 'Italian')
  ) {
    cuisineScore = 10; // complete clash
  } else {
    cuisineScore = 40; // partial match
  }

  // reviewsSentiment (0-100 score): NLP parsed sentiment
  const textReviews = document.getElementById('nexus-reviews-text').value || r.reviews;
  const sentimentResult = DataModels.analyzeReviewSentiment(textReviews);
  const reviewsScore = sentimentResult.score;

  const inputs = {
    distanceFit: distScore,
    cuisineFit: cuisineScore,
    reviewsSentiment: reviewsScore
  };

  // 2. Compute Box C Likert Weights
  const scaleNorm = (rating) => (rating.imp * 0.5 + rating.urg * 0.2 + rating.nec * 0.3) / 5;
  const weights = {
    distanceFit: scaleNorm(appState.nexus.likert.dist),
    cuisineFit: scaleNorm(appState.nexus.likert.cui),
    reviewsSentiment: scaleNorm(appState.nexus.likert.rev)
  };

  // Apply Weights to Rules
  applyRulesWeights(nexusFIS, weights);

  // Solve FIS
  const solveResult = nexusFIS.solve(inputs);
  const finalMatch = solveResult.outputs.matchScore;
  const explanations = solveResult.explanations;

  // 3. Render Badges
  document.getElementById('nexus-score-val').textContent = `${finalMatch.toFixed(1)}%`;
  
  const badge = document.getElementById('nexus-decision-badge');
  const desc = document.getElementById('nexus-decision-desc');
  
  badge.className = "score-badge ";
  if (finalMatch >= 75) {
    badge.textContent = "High Match";
    badge.classList.add("high");
    desc.textContent = "Outstanding choice! Near distance, preferred cuisine, and excellent reviews make this a solid recommendation.";
  } else if (finalMatch >= 45) {
    badge.textContent = "Moderate Fit";
    badge.classList.add("mid");
    desc.textContent = "Acceptable choice. Matches some core parameters, but has some distance, cuisine clash, or minor review complaints.";
  } else {
    badge.textContent = "Poor Fit";
    badge.classList.add("low");
    desc.textContent = "Not recommended. Fails primary distance limits, doesn't match preferred cuisine, or reviews are critical.";
  }

  // 4. Highlight Reviews Text
  highlightReviewsNLP(textReviews, sentimentResult.positives, sentimentResult.negatives);

  // 5. Render XAI Plots
  const baselineNexus = 50;
  const contributions = calculateSHAPContributions(nexusFIS, inputs, baselineNexus);
  window.XAIVisualizer.drawSHAPForcePlot('shap-plot-nexus', contributions, baselineNexus, finalMatch);

  window.XAIVisualizer.drawDefuzzificationShape(
    'centroid-plot-nexus', 
    nexusFIS.variables.matchScore, 
    explanations.aggregatedOutputShape, 
    finalMatch, 
    explanations.termMaxActivations
  );

  window.XAIVisualizer.renderRuleBaseMap('rules-list-nexus', explanations.ruleActivations);
}

function highlightReviewsNLP(text, positives, negatives) {
  const container = document.getElementById('nexus-sentiment-markup');
  if (!container) return;
  
  if (!text) {
    container.innerHTML = "<span class='text-slate-500'>No reviews text available. Click a restaurant to load reviews.</span>";
    return;
  }

  let html = text;
  
  // Escape special chars for regex
  const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // Highlight positive words
  positives.forEach(word => {
    const escaped = escapeRegex(word);
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    html = html.replace(regex, `<span class="sentiment-pos">${word}</span>`);
  });

  // Highlight negative words
  negatives.forEach(word => {
    const escaped = escapeRegex(word);
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    html = html.replace(regex, `<span class="sentiment-neg">${word}</span>`);
  });

  container.innerHTML = html;
}

function populateRestaurantsList() {
  const list = document.getElementById('restaurants-list');
  if (!list) return;
  list.innerHTML = "";

  const customRests = appState.nexus.customRestaurantsList;
  const preloadedRests = DataModels.RESTAURANTS;
  const allRests = [...customRests, ...preloadedRests];

  allRests.forEach(r => {
    const div = document.createElement('div');
    div.className = `candidate-item ${r.id === appState.nexus.selectedRestaurant ? 'active' : ''}`;
    div.id = `rest-${r.id}`;
    div.onclick = () => loadRestaurant(r.id);

    const info = document.createElement('div');
    info.className = "candidate-info";
    
    const name = document.createElement('h4');
    name.innerHTML = `${r.name} <a href="${r.url}" target="_blank" class="external-link-icon" onclick="event.stopPropagation()"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
    info.appendChild(name);

    const desc = document.createElement('p');
    const priceSigns = "$".repeat(r.price);
    desc.textContent = `${r.cuisine} | Dist: ${r.distance.toFixed(1)} km | Price: ${priceSigns}`;
    info.appendChild(desc);
    
    div.appendChild(info);

    // Initial score indicator
    const badge = document.createElement('span');
    badge.className = "score-badge text-xs px-2 py-0.5 ";
    
    // Quick evaluate for directory score
    const targetCuisine = appState.nexus.targetCuisine;
    const maxTargetDist = appState.nexus.targetDistance;
    const isCuiMatch = r.cuisine === targetCuisine;
    const isDistMatch = r.distance <= maxTargetDist;
    
    if (isCuiMatch && isDistMatch) {
      badge.textContent = "Strong Match";
      badge.classList.add("high");
    } else if (isCuiMatch || isDistMatch) {
      badge.textContent = "Partial Match";
      badge.classList.add("mid");
    } else {
      badge.textContent = "Low Match";
      badge.classList.add("low");
    }
    
    div.appendChild(badge);
    list.appendChild(div);
  });
}

function loadRestaurant(id) {
  appState.nexus.selectedRestaurant = id;

  document.querySelectorAll('#restaurants-list .candidate-item').forEach(item => item.classList.remove('active'));
  const activeCard = document.getElementById(`rest-${id}`);
  if (activeCard) activeCard.classList.add('active');

  const customRests = appState.nexus.customRestaurantsList;
  const preloadedRests = DataModels.RESTAURANTS;
  const r = customRests.find(item => item.id === id) || preloadedRests.find(item => item.id === id);
  if (!r) return;

  document.getElementById('nexus-reviews-text').value = r.reviews.trim();
  updateNexusView();
}

function onCustomReviewsInput() {
  updateNexusView();
}

function onNexusTargetChanged() {
  const cuisineSelect = document.getElementById('nexus-target-cuisine');
  appState.nexus.targetCuisine = cuisineSelect.value;
  
  populateRestaurantsList();
  updateNexusView();
}

function onNexusTargetSliderChanged() {
  const slide = document.getElementById('slide-nexus-target-dist');
  const maxD = parseFloat(slide.value);
  appState.nexus.targetDistance = maxD;
  
  document.getElementById('val-nexus-target-dist').textContent = `${maxD.toFixed(1)} km`;
  
  populateRestaurantsList();
  updateNexusView();
}

function setLikert(factor, scale, value) {
  appState.nexus.likert[factor][scale] = value;
  
  // Clear active classes in pills row
  const pillsContainer = document.getElementById(`likert-${factor}-${scale}`);
  if (pillsContainer) {
    pillsContainer.querySelectorAll('.likert-pill').forEach((pill, idx) => {
      if (idx + 1 === value) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }
  
  updateNexusView();
}

function addNewNexusLink() {
  const name = document.getElementById('nexus-new-name').value.trim();
  const url = document.getElementById('nexus-new-url').value.trim() || "https://example.com";
  const cuisine = document.getElementById('nexus-new-cuisine').value;
  const distance = parseFloat(document.getElementById('slide-nexus-new-dist').value);

  if (!name) {
    alert("Please enter a restaurant name to add to the resource board.");
    return;
  }

  const newId = `custom_rest_${Date.now()}`;
  const newRest = {
    id: newId,
    name: name,
    url: url,
    cuisine: cuisine,
    distance: distance,
    price: 2, // default mid price
    reviews: `${name} is amazing and cozy! Service is quick and friendly. Highly recommended spot with delicious options and great value.`
  };

  appState.nexus.customRestaurantsList.unshift(newRest);
  appState.nexus.selectedRestaurant = newId;

  // Clear inputs
  document.getElementById('nexus-new-name').value = "";
  document.getElementById('nexus-new-url').value = "";

  populateRestaurantsList();
  loadRestaurant(newId);
}

// --- Theme Toggler ---
function toggleTheme() {
  const html = document.documentElement;
  const theme = html.getAttribute('data-theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  
  const icon = document.getElementById('theme-icon');
  const txt = document.getElementById('theme-text');
  
  if (newTheme === 'dark') {
    icon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>`;
    txt.textContent = "Light Mode";
  } else {
    // Moon Icon
    icon.innerHTML = `<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
    txt.textContent = "Dark Mode";
  }
}

// --- Upload File Processor ---
function handleUploadedFile(file) {
  if (file && (file.type === "text/plain" || file.name.endsWith('.txt'))) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      document.getElementById('resume-text-input').value = text.trim();
      
      const label = document.querySelector('#resume-drop-zone span');
      if (label) label.textContent = `Success: Loaded ${file.name}`;
      
      onCustomResumeInput();
    };
    reader.readAsText(file);
  } else {
    alert("FuzzyXAI parses text-based resumes. Please upload a standard .txt resume file.");
  }
}

// --- DOM Initialization ---
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeFuzzySystems();
    populateJDSelect();
    populateCandidatesList();
    
    // Trigger first JD setup
    onJDChanged();

    // Setup Performance Tab details
    populateEmployeesList();
    loadEmployee('emp_101');

    // Setup Tab 3 Decision Nexus
    populateRestaurantsList();
    loadRestaurant('restaurant_1');

    // Trigger initial tabs layouts
    switchTab('screener');

    // --- Interactive Graph Clicks Hook ---
    window.addEventListener('membership-click', (e) => {
      const { varName, value } = e.detail;
      const keyMap = { skills: 'skills', experience: 'experience', alignment: 'alignment', culture: 'culture', education: 'education' };
      const key = keyMap[varName];
      if (key) {
        appState.screener.inputs[key] = value;
        const slider = document.getElementById(`slide-${key}`);
        if (slider) slider.value = value;
        updateScreenerView();
      }
    });

    // --- Drag & Drop Resumes Setup ---
    const dropZone = document.getElementById('resume-drop-zone');
    const fileInput = document.getElementById('file-uploader');

    if (dropZone && fileInput) {
      // Prevent default clicks on drag events to allow drop
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--accent-indigo)';
          dropZone.style.background = 'rgba(99, 102, 241, 0.06)';
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--card-border)';
          dropZone.style.background = 'rgba(255, 255, 255, 0.01)';
        }, false);
      });

      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          handleUploadedFile(files[0]);
        }
      }, false);

      fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
          handleUploadedFile(fileInput.files[0]);
        }
      });
    }
  });
}
