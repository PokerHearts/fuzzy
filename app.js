/**
 * Flat Professional Light-Mode Application Controller
 * Manages global state, handles multiple FileReaders for batch candidate uploads,
 * performs keyword JD extractions, calculates cosine similarities, drives
 * natural narrative reports, and renders the visual XAI SVG dashboards.
 */

// Import classes if node/testing environment, otherwise use globals
const FIS = typeof window !== 'undefined' ? window.FuzzyEngine : require('./fuzzyEngine.js');
const DataModels = typeof window !== 'undefined' ? window.HRData : require('./data.js');

// --- Global Known Skills Dictionary for Heuristic Parsing ---
const ALL_KNOWN_SKILLS = [
  "javascript", "css", "html", "react", "performance", "architecture", "ux", "accessibility", 
  "typescript", "testing", "webpack", "vite", "web components", "python", "machine learning", 
  "pytorch", "tensorflow", "statistics", "sql", "pandas", "data engineering", "explainable ai", 
  "transformers", "algorithms", "r", "spark", "agile", "scrum", "roadmap", "user research", 
  "analytics", "strategy", "market analysis", "wireframing", "jira", "communication", "product lifecycle"
];

// --- Global Application State ---
const appState = {
  currentTab: 'screener',
  userManualExpanded: false,
  screener: {
    selectedJD: 'frontend_architect',
    activeJD: {
      title: "Senior Frontend Architect",
      skills: ["javascript", "css", "html", "react", "performance", "architecture", "ux", "accessibility", "typescript", "testing", "webpack", "vite", "web components"],
      minExp: 8,
      prefEducation: "bachelor"
    },
    selectedCandidate: 'candidate_1',
    candidatesList: [], // Dynamically populated
    weights: { skills: 1.0, experience: 1.0, alignment: 0.8, culture: 0.8, education: 0.6 },
    inputs: { skills: 80, experience: 9, alignment: 75, culture: 80, education: 85 }
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
    customRestaurantsList: []
  }
};

// --- Fuzzy System Configurations ---
let screenerFIS;
let performanceFIS;
let nexusFIS;

function initializeFuzzySystems() {
  // ==========================================
  // 1. CANDIDATE SCREENING SYSTEM
  // ==========================================
  screenerFIS = new FIS.FuzzySystem();

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

// --- Dynamic Rules Weighting ---
function applyRulesWeights(fis, weightsMapping) {
  fis.rules.forEach(rule => {
    let weight = 1.0;
    
    const getWeights = (node) => {
      if (!node) return [];
      if (node.var) return [weightsMapping[node.var] || 1.0];
      return [...getWeights(node.left), ...getWeights(node.right)];
    };
    
    const nodeWeights = getWeights(rule.antecedent);
    if (nodeWeights.length > 0) {
      weight = nodeWeights.reduce((a, b) => a + b, 0) / nodeWeights.length;
    }
    rule.weight = weight;
  });
}

// --- Dynamic SHAP Contribution plots ---
function calculateSHAPContributions(fis, currentInputs, baselineValue) {
  const contributions = {};
  const variables = Object.values(fis.variables).filter(v => !v.isOutput);
  
  const finalResult = fis.solve(currentInputs);
  const outputVar = Object.keys(finalResult.outputs)[0];
  const finalScore = finalResult.outputs[outputVar];

  variables.forEach(variable => {
    const midValue = (variable.max + variable.min) / 2;
    const modifiedInputs = { ...currentInputs };
    modifiedInputs[variable.name] = midValue;

    const modResult = fis.solve(modifiedInputs);
    const modScore = modResult.outputs[outputVar];

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

// --- Collapsible User Guide toggle ---
function toggleUserGuide() {
  const guide = document.getElementById('user-guide-accordion');
  if (guide) {
    guide.classList.toggle('active');
    appState.userManualExpanded = guide.classList.contains('active');
  }
}

// ==========================================
// 1. RESUME SCREENER (TAB 1) CONTROLLERS
// ==========================================

function updateScreenerView() {
  const selectedCandId = appState.screener.selectedCandidate;
  const cand = appState.screener.candidatesList.find(c => c.id === selectedCandId);
  if (!cand) return;

  const inputs = appState.screener.inputs;
  const weights = appState.screener.weights;
  
  // Re-solve FIS
  applyRulesWeights(screenerFIS, weights);
  const solveResult = screenerFIS.solve(inputs);
  const finalFit = solveResult.outputs.fit;
  const explanations = solveResult.explanations;

  // Store final fit on candidate and update leaderboard table
  cand.finalScore = finalFit;
  
  // Re-populate Table dynamically to show correct rank scores
  populateLeaderboardTable();

  // 1. Render Final Score Badges
  document.getElementById('final-score-val').textContent = `${finalFit.toFixed(1)}%`;
  
  const badge = document.getElementById('final-decision-badge');
  badge.className = "score-badge ";
  if (finalFit >= 72) {
    badge.textContent = "Exceptional Fit (Recommend)";
    badge.classList.add("high");
  } else if (finalFit >= 45) {
    badge.textContent = "Average Match (Phone Screen)";
    badge.classList.add("mid");
  } else {
    badge.textContent = "Poor Alignment (Reject)";
    badge.classList.add("low");
  }

  // 2. Render Plain-English Narrative decision summary
  const summaryBox = document.getElementById('decision-summary-content');
  const jdTitle = appState.screener.activeJD.title;
  summaryBox.innerHTML = DataModels.generateDecisionSummary(cand.name, inputs, finalFit, jdTitle);

  // 3. Render Resume Viewer with Match Highlights
  const viewerBox = document.getElementById('resume-viewer-content');
  const targetSkills = appState.screener.activeJD.skills;
  const matchedAnalysis = DataModels.parseResumeSkills(cand.resumeText, targetSkills);
  
  let formattedResume = cand.resumeText.trim();
  matchedAnalysis.matched.forEach(skill => {
    // Escape and highlight skill in resume view
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    formattedResume = formattedResume.replace(regex, `<mark>${skill}</mark>`);
  });
  viewerBox.innerHTML = formattedResume;

  // 4. Render active variables labels
  document.getElementById('val-skills').textContent = `${inputs.skills.toFixed(0)}%`;
  document.getElementById('val-experience').textContent = `${inputs.experience.toFixed(1)} Years`;
  document.getElementById('val-alignment').textContent = `${inputs.alignment.toFixed(0)}%`;
  document.getElementById('val-culture').textContent = `${inputs.culture.toFixed(0)}%`;
  
  const eduLabels = { 20: "None", 40: "Associate", 60: "Bachelor", 85: "Master", 100: "PhD" };
  let closestEdu = 20;
  Object.keys(eduLabels).forEach(k => {
    if (Math.abs(inputs.education - k) < Math.abs(inputs.education - closestEdu)) {
      closestEdu = parseInt(k);
    }
  });
  document.getElementById('val-education').textContent = eduLabels[closestEdu];

  // 5. Render SVG XAI Graphs
  const baselineScreener = 55;
  const contributions = calculateSHAPContributions(screenerFIS, inputs, baselineScreener);
  window.XAIVisualizer.drawSHAPForcePlot('shap-plot-screener', contributions, baselineScreener, finalFit);

  window.XAIVisualizer.drawDefuzzificationShape(
    'centroid-plot-screener', 
    screenerFIS.variables.fit, 
    explanations.aggregatedOutputShape, 
    finalFit, 
    explanations.termMaxActivations
  );

  window.XAIVisualizer.drawMembershipCurves('mf-skills', screenerFIS.variables.skills, inputs.skills);
  window.XAIVisualizer.drawMembershipCurves('mf-experience', screenerFIS.variables.experience, inputs.experience);
  window.XAIVisualizer.drawMembershipCurves('mf-alignment', screenerFIS.variables.alignment, inputs.alignment);
  window.XAIVisualizer.drawMembershipCurves('mf-culture', screenerFIS.variables.culture, inputs.culture);

  window.XAIVisualizer.renderRuleBaseMap('rules-list-screener', explanations.ruleActivations);
}

function reEvaluateAllCandidates() {
  const activeJD = appState.screener.activeJD;
  
  appState.screener.candidatesList.forEach(cand => {
    // Skills match %
    const skillAnalysis = DataModels.parseResumeSkills(cand.resumeText, activeJD.skills);
    cand.skillsPercent = skillAnalysis.percent;
    cand.matchedSkills = skillAnalysis.matched;
    cand.missingSkills = skillAnalysis.missing;

    // Alignment cosine similarity index
    cand.alignmentPercent = DataModels.calculateHistoricalAlignment(skillAnalysis.matched, appState.screener.selectedJD);

    // Education match score
    cand.educationPercent = DataModels.getEducationMatchScore(cand.education, activeJD.prefEducation);

    // Composite culture fit
    const cultureScore = cand.collaboration * 0.4 + cand.adaptability * 0.4 + cand.leadership * 0.2;

    // Build inputs and Solve fuzzy score for catalog ranking
    const cInputs = {
      skills: skillAnalysis.percent,
      experience: cand.experience,
      alignment: cand.alignmentPercent,
      culture: cultureScore,
      education: cand.educationPercent
    };

    applyRulesWeights(screenerFIS, appState.screener.weights);
    const result = screenerFIS.solve(cInputs);
    cand.finalScore = result.outputs.fit;
  });

  // Sort Leaderboard: Rank by compatibility score descending
  appState.screener.candidatesList.sort((a, b) => b.finalScore - a.finalScore);
  
  populateLeaderboardTable();
}

function populateLeaderboardTable() {
  const tbody = document.getElementById('leaderboard-rows');
  if (!tbody) return;
  tbody.innerHTML = "";

  appState.screener.candidatesList.forEach((cand, idx) => {
    const tr = document.createElement('tr');
    if (cand.id === appState.screener.selectedCandidate) {
      tr.className = "active";
    }
    tr.onclick = () => loadCandidate(cand.id);

    // Columns: Rank, Name, Fit %, Skills %, Alignment %, Verdict
    const rankTd = document.createElement('td');
    rankTd.innerHTML = `<strong>#${idx + 1}</strong>`;
    tr.appendChild(rankTd);

    const nameTd = document.createElement('td');
    nameTd.textContent = cand.name;
    tr.appendChild(nameTd);

    const scoreTd = document.createElement('td');
    scoreTd.innerHTML = `<strong>${cand.finalScore.toFixed(1)}%</strong>`;
    tr.appendChild(scoreTd);

    const skillsTd = document.createElement('td');
    skillsTd.textContent = `${cand.skillsPercent.toFixed(0)}%`;
    tr.appendChild(skillsTd);

    const alignTd = document.createElement('td');
    alignTd.textContent = `${cand.alignmentPercent.toFixed(0)}%`;
    tr.appendChild(alignTd);

    const verdictTd = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = "score-badge text-xs ";
    if (cand.finalScore >= 72) {
      badge.textContent = "Recommend";
      badge.classList.add("high");
    } else if (cand.finalScore >= 45) {
      badge.textContent = "Screening Call";
      badge.classList.add("mid");
    } else {
      badge.textContent = "Reject";
      badge.classList.add("low");
    }
    verdictTd.appendChild(badge);
    tr.appendChild(verdictTd);

    tbody.appendChild(tr);
  });
}

function loadCandidate(candId) {
  appState.screener.selectedCandidate = candId;
  
  // Highlight active leaderboard row
  document.querySelectorAll('#leaderboard-rows tr').forEach((tr, idx) => {
    const cand = appState.screener.candidatesList[idx];
    if (cand && cand.id === candId) {
      tr.className = "active";
    } else {
      tr.className = "";
    }
  });

  const cand = appState.screener.candidatesList.find(c => c.id === candId);
  if (!cand) return;

  const activeJD = appState.screener.activeJD;

  // Sync state inputs with selected candidate parameters
  appState.screener.inputs = {
    skills: cand.skillsPercent,
    experience: cand.experience,
    alignment: cand.alignmentPercent,
    culture: cand.collaboration * 0.4 + cand.adaptability * 0.4 + cand.leadership * 0.2,
    education: cand.educationPercent
  };

  // Sync sliders
  document.getElementById('slide-skills').value = appState.screener.inputs.skills;
  document.getElementById('slide-experience').value = appState.screener.inputs.experience;
  document.getElementById('slide-alignment').value = appState.screener.inputs.alignment;
  document.getElementById('slide-culture').value = appState.screener.inputs.culture;
  document.getElementById('slide-education').value = appState.screener.inputs.education;

  // Sync target skills gaps pills list
  const badgeContainer = document.getElementById('candidate-skills-badges');
  badgeContainer.innerHTML = "";
  
  cand.matchedSkills.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge active";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });
  
  cand.missingSkills.forEach(s => {
    const pill = document.createElement('span');
    pill.className = "pill-badge missing";
    pill.textContent = s;
    badgeContainer.appendChild(pill);
  });

  updateScreenerView();
}

// --- Box A: JD Flexible Input Event Handlers ---

function loadJDTemplate(templateId) {
  appState.screener.selectedJD = templateId;
  const template = DataModels.JOB_DESCRIPTIONS[templateId];
  if (!template) return;

  appState.screener.activeJD = {
    title: template.title,
    skills: [...template.skills],
    minExp: template.minExp,
    prefEducation: template.prefEducation
  };

  // Sync DOM JDs controls
  document.getElementById('jd-text-input').value = `Job Title: ${template.title}\n\nRequired Skills: ${template.skills.join(", ")}\n\nMin Experience: ${template.minExp} years\nPreferred Education: ${template.prefEducation}`;
  document.getElementById('jd-link-input').value = "";
  
  renderJDSkillsBadges();
  reEvaluateAllCandidates();
  if (appState.screener.candidatesList.length > 0) {
    loadCandidate(appState.screener.candidatesList[0].id);
  }
}

function scrapeJDLink() {
  const url = document.getElementById('jd-link-input').value.trim();
  if (!url) {
    alert("Please paste a valid LinkedIn or Naukri Job Profile URL link.");
    return;
  }

  const scraped = DataModels.parseJDFromUrl(url);
  if (!scraped) return;

  appState.screener.activeJD = scraped;
  
  // Sync DOM textbox to show scraped outcomes
  document.getElementById('jd-text-input').value = `Job Title: ${scraped.title}\n\nExtracted Required Skills: ${scraped.skills.join(", ")}\n\nScraped Min Experience: ${scraped.minExp} years\nPreferred Education: ${scraped.prefEducation}\nSource URL: ${url}`;
  
  renderJDSkillsBadges();
  reEvaluateAllCandidates();
  if (appState.screener.candidatesList.length > 0) {
    loadCandidate(appState.screener.candidatesList[0].id);
  }
}

function onCustomJDInput() {
  const text = document.getElementById('jd-text-input').value.trim().toLowerCase();
  
  // Simple heuristic: extract any known skills found in typed JD text
  const extractedSkills = [];
  ALL_KNOWN_SKILLS.forEach(skill => {
    if (text.includes(skill)) {
      extractedSkills.push(skill);
    }
  });

  // Extract experience years
  let exp = 5; // default fallback
  const expMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i) || text.match(/experience\s*:\s*(\d+)/i);
  if (expMatch && expMatch[1]) {
    exp = parseInt(expMatch[1]);
  }

  // Extract education preferences
  let prefEdu = "bachelor";
  if (text.includes("phd") || text.includes("doctorate")) prefEdu = "phd";
  else if (text.includes("master") || text.includes("ms") || text.includes("mtech")) prefEdu = "master";

  // Build target active JD
  appState.screener.activeJD = {
    title: "Custom Tailored Role Profile",
    skills: extractedSkills.length > 0 ? extractedSkills : ["javascript", "communication"],
    minExp: exp,
    prefEducation: prefEdu
  };

  renderJDSkillsBadges();
  reEvaluateAllCandidates();
  if (appState.screener.candidatesList.length > 0) {
    loadCandidate(appState.screener.candidatesList[0].id);
  }
}

function renderJDSkillsBadges() {
  const badges = document.getElementById('jd-skills-badges');
  if (!badges) return;
  badges.innerHTML = "";
  
  appState.screener.activeJD.skills.forEach(skill => {
    const pill = document.createElement('span');
    pill.className = "pill-badge active";
    pill.textContent = skill;
    badges.appendChild(pill);
  });
}

// Sandbox Counterfactual manual sliders hooks
function onSliderAdjusted(type) {
  const slide = document.getElementById(`slide-${type}`);
  appState.screener.inputs[type] = parseFloat(slide.value);
  updateScreenerView();
}

function onWeightsChanged() {
  appState.screener.weights = {
    skills: parseFloat(document.getElementById('weight-skills').value),
    experience: parseFloat(document.getElementById('weight-experience').value),
    alignment: parseFloat(document.getElementById('weight-alignment').value),
    culture: parseFloat(document.getElementById('weight-culture').value),
    education: parseFloat(document.getElementById('weight-education').value)
  };
  reEvaluateAllCandidates();
  updateScreenerView();
}

// ==========================================
// 2. PERFORMANCE VIEW (TAB 2) CONTROLLERS
// ==========================================

function updatePerformanceView() {
  const inputs = appState.performance.inputs;
  const weights = appState.performance.weights;

  applyRulesWeights(performanceFIS, weights);
  const solveResult = performanceFIS.solve(inputs);
  const finalPerf = solveResult.outputs.performance;
  const explanations = solveResult.explanations;

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
    badge.classList.add("high");
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

  document.getElementById('val-perf-prod').textContent = `${inputs.prod.toFixed(0)}%`;
  document.getElementById('val-perf-qual').textContent = `${inputs.qual.toFixed(0)}%`;
  document.getElementById('val-perf-coll').textContent = `${inputs.coll.toFixed(0)}%`;
  document.getElementById('val-perf-adap').textContent = `${inputs.adap.toFixed(0)}%`;
  document.getElementById('val-perf-auto').textContent = `${inputs.auto.toFixed(0)}%`;

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

function populateEmployeesList() {
  const list = document.getElementById('employees-list');
  if (!list) return;
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

    const badge = document.createElement('span');
    badge.className = "score-badge text-xs ";
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
  if (!emp) return;

  appState.performance.inputs = {
    prod: emp.productivity,
    qual: emp.quality,
    coll: emp.collaboration,
    adap: emp.adaptability,
    auto: emp.autonomy
  };

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
  
  let r = customRests.find(item => item.id === selectedRestId) || preloadedRests.find(item => item.id === selectedRestId);
  if (!r) {
    if (preloadedRests.length > 0) r = preloadedRests[0];
    else return;
  }

  // Calculate fuzzy inputs
  const maxTargetDist = appState.nexus.targetDistance;
  const actualDist = r.distance;
  let distScore = 100;
  if (actualDist > maxTargetDist) {
    distScore = Math.max(10, 100 - (actualDist - maxTargetDist) * 15);
  }
  
  const targetCuisine = appState.nexus.targetCuisine;
  let cuisineScore = 10;
  if (r.cuisine === targetCuisine) cuisineScore = 100;
  else if (
    (r.cuisine === 'Italian' && targetCuisine === 'Sushi') ||
    (r.cuisine === 'Sushi' && targetCuisine === 'Italian')
  ) {
    cuisineScore = 10;
  } else {
    cuisineScore = 40;
  }

  const textReviews = document.getElementById('nexus-reviews-text').value || r.reviews;
  const sentimentResult = DataModels.analyzeReviewSentiment(textReviews);
  const reviewsScore = sentimentResult.score;

  const inputs = {
    distanceFit: distScore,
    cuisineFit: cuisineScore,
    reviewsSentiment: reviewsScore
  };

  // Box C Likert composite weights normalization
  const scaleNorm = (rating) => (rating.imp * 0.5 + rating.urg * 0.2 + rating.nec * 0.3) / 5;
  const weights = {
    distanceFit: scaleNorm(appState.nexus.likert.dist),
    cuisineFit: scaleNorm(appState.nexus.likert.cui),
    reviewsSentiment: scaleNorm(appState.nexus.likert.rev)
  };

  applyRulesWeights(nexusFIS, weights);

  const solveResult = nexusFIS.solve(inputs);
  const finalMatch = solveResult.outputs.matchScore;
  const explanations = solveResult.explanations;

  document.getElementById('nexus-score-val').textContent = `${finalMatch.toFixed(1)}%`;
  
  const badge = document.getElementById('nexus-decision-badge');
  const desc = document.getElementById('nexus-decision-desc');
  
  badge.className = "score-badge ";
  if (finalMatch >= 75) {
    badge.textContent = "Highly Compatible";
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

  highlightReviewsNLP(textReviews, sentimentResult.positives, sentimentResult.negatives);

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
    container.innerHTML = "<span class='text-slate-400'>No reviews loaded. Select a restaurant.</span>";
    return;
  }

  let html = text;
  const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  positives.forEach(word => {
    const escaped = escapeRegex(word);
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    html = html.replace(regex, `<span class="sentiment-pos">${word}</span>`);
  });

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

    const badge = document.createElement('span');
    badge.className = "score-badge text-xs ";
    
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
    
    badge.style.minWidth = "85px";
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
    price: 2,
    reviews: `${name} is amazing and cozy! Service is quick and friendly. Highly recommended spot with delicious options and great value.`
  };

  appState.nexus.customRestaurantsList.unshift(newRest);
  appState.nexus.selectedRestaurant = newId;

  document.getElementById('nexus-new-name').value = "";
  document.getElementById('nexus-new-url').value = "";

  populateRestaurantsList();
  loadRestaurant(newId);
}

// ==========================================
// BATCH BULK RESUME UPLOAD FILES READER LOOP
// ==========================================

function handleUploadedFile(file) {
  if (file && (file.type === "text/plain" || file.name.endsWith('.txt'))) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.trim();
      
      // Parse custom candidate heuristics
      let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let name = file.name.replace(/\.[^/.]+$/, ""); // fallback to filename
      if (lines.length > 0) {
        // Simple heuristic: search first three lines for a clean name (Capitalized words)
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          if (lines[i].length < 35 && /^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*)+$/.test(lines[i])) {
            name = lines[i];
            break;
          }
        }
      }

      // Experience parsing heuristic
      let experience = 3;
      const expMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i) || text.match(/experience\s*:\s*(\d+)/i);
      if (expMatch && expMatch[1]) {
        experience = Math.min(15, parseInt(expMatch[1]));
      }

      // Education heuristic
      let education = "bachelor";
      if (/ph\.?d|doctorate/i.test(text)) education = "phd";
      else if (/master|m\.s\.|m\.tech/i.test(text)) education = "master";

      // Culture heuristics
      let coll = 75, adap = 75, lead = 60;
      if (/led|directed|spearheaded/i.test(text)) lead = 85;
      if (/collaborated|teamwork|scrum/i.test(text)) coll = 90;
      if (/adapted|flexible|fast learner/i.test(text)) adap = 90;

      const newCandidate = {
        id: `uploaded_cand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name,
        targetRole: appState.screener.selectedJD,
        experience: experience,
        education: education,
        collaboration: coll,
        adaptability: adap,
        leadership: lead,
        resumeText: text
      };

      // Add to state candidates list (at the top)
      appState.screener.candidatesList.unshift(newCandidate);
      
      // Select the newly uploaded candidate
      appState.screener.selectedCandidate = newCandidate.id;

      // Re-evaluate and reload
      reEvaluateAllCandidates();
      loadCandidate(newCandidate.id);
    };
    reader.readAsText(file);
  }
}

function handleBatchUploads(files) {
  if (files.length === 0) return;
  
  // Clear file label to show count
  const label = document.querySelector('#resume-drop-zone span');
  if (label) label.textContent = `Batch parsed successfully: Loaded ${files.length} resumes!`;

  // Process all files in parallel
  Array.from(files).forEach(file => {
    handleUploadedFile(file);
  });
}

// --- DOM Initializations ---
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeFuzzySystems();

    // 1. Set active candidates catalog from mock directory out of the box
    appState.screener.candidatesList = [...DataModels.CANDIDATES];

    // 2. Setup flexible Box A Job Description Templates
    loadJDTemplate('frontend_architect');

    // 3. Setup Tab 2 Performance directories
    populateEmployeesList();
    loadEmployee('emp_101');

    // 4. Setup Tab 3 Decision Nexus
    populateRestaurantsList();
    loadRestaurant('restaurant_1');

    // Default Swapper Tab
    switchTab('screener');

    // Collapse user guide accordion initially
    const manual = document.getElementById('user-guide-accordion');
    if (manual) manual.classList.remove('active');

    // --- Interactive SVG Snapping Clicks Listener ---
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

    // --- Drag & Drop Batch Resumes Uploader Binds ---
    const dropZone = document.getElementById('resume-drop-zone');
    const fileInput = document.getElementById('file-uploader');

    if (dropZone && fileInput) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--accent-indigo)';
          dropZone.style.background = 'var(--accent-indigo-light)';
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.style.borderColor = '#cbd5e1';
          dropZone.style.background = 'var(--bg-primary)';
        }, false);
      });

      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          handleBatchUploads(files);
        }
      }, false);

      fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
          handleBatchUploads(fileInput.files);
        }
      });
    }
  });
}
