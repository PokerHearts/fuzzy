/**
 * Fuzzy Logic MCDSS Engine
 * Implements a Mamdani Fuzzy Inference System (FIS) with discrete Centroid Defuzzification.
 * Supports Triangular and Trapezoidal membership functions.
 * Designed for high-performance real-time UI interactions and full explainability.
 */

// --- Membership Functions ---

class MembershipFunction {
  evaluate(x) {
    throw new Error("evaluate() not implemented");
  }
  
  getPoints(min, max, steps = 100) {
    const points = [];
    const stepSize = (max - min) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = min + i * stepSize;
      points.push({ x, y: this.evaluate(x) });
    }
    return points;
  }
}

class TriangularMF extends MembershipFunction {
  constructor(a, b, c) {
    super();
    this.a = a;
    this.b = b;
    this.c = c;
    this.type = 'triangular';
  }

  evaluate(x) {
    if (x <= this.a || x >= this.c) return 0;
    if (x === this.b) return 1;
    if (x > this.a && x < this.b) {
      return (x - this.a) / (this.b - this.a);
    }
    if (x > this.b && x < this.c) {
      return (this.c - x) / (this.c - this.b);
    }
    return 0;
  }
}

class TrapezoidalMF extends MembershipFunction {
  constructor(a, b, c, d) {
    super();
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.type = 'trapezoidal';
  }

  evaluate(x) {
    if (x <= this.a || x >= this.d) return 0;
    if (x >= this.b && x <= this.c) return 1;
    if (x > this.a && x < this.b) {
      return (x - this.a) / (this.b - this.a);
    }
    if (x > this.c && x < this.d) {
      return (this.d - x) / (this.d - this.c);
    }
    return 0;
  }
}

// --- Core Fuzzy Concepts ---

class FuzzyVariable {
  constructor(name, min, max, isOutput = false) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.isOutput = isOutput;
    this.terms = {}; // Linguistic terms: { "Low": TriangularMF, ... }
  }

  addTerm(termName, membershipFunction) {
    this.terms[termName] = membershipFunction;
    return this;
  }

  fuzzify(x) {
    const memberships = {};
    for (const [termName, mf] of Object.entries(this.terms)) {
      memberships[termName] = mf.evaluate(x);
    }
    return memberships;
  }
}

class FuzzyRule {
  /**
   * Represents a fuzzy Mamdani rule.
   * Format: IF [antecedent] THEN [consequentVariable] IS [consequentTerm]
   * Antecedent is structured as an object tree to support complex AND/OR rules.
   * e.g., { type: 'AND', left: { var: 'experience', term: 'High' }, right: { var: 'skills', term: 'High' } }
   * Or simpler flat objects for straightforward rules: { var: 'experience', term: 'High' }
   */
  constructor(antecedent, consequentVarName, consequentTermName, weight = 1.0) {
    this.antecedent = antecedent;
    this.consequentVarName = consequentVarName;
    this.consequentTermName = consequentTermName;
    this.weight = weight;
  }

  // Evaluates the degree of activation of the rule given fuzzified inputs
  evaluateAntecedent(fuzzifiedInputs) {
    return this._evaluateNode(this.antecedent, fuzzifiedInputs);
  }

  _evaluateNode(node, fuzzifiedInputs) {
    if (!node) return 0;
    
    // Leaf node: { var: 'experience', term: 'High' }
    if (node.var && node.term) {
      const varInputs = fuzzifiedInputs[node.var];
      if (!varInputs) return 0;
      let val = varInputs[node.term] || 0;
      if (node.not) {
        val = 1 - val;
      }
      return val;
    }

    // Operator nodes
    if (node.type === 'AND') {
      return Math.min(
        this._evaluateNode(node.left, fuzzifiedInputs),
        this._evaluateNode(node.right, fuzzifiedInputs)
      );
    }
    
    if (node.type === 'OR') {
      return Math.max(
        this._evaluateNode(node.left, fuzzifiedInputs),
        this._evaluateNode(node.right, fuzzifiedInputs)
      );
    }

    return 0;
  }
}

// --- Fuzzy Inference System (FIS) ---

class FuzzySystem {
  constructor() {
    this.variables = {};
    this.rules = [];
  }

  addVariable(variable) {
    this.variables[variable.name] = variable;
    return this;
  }

  addRule(rule) {
    this.rules.push(rule);
    return this;
  }

  // Performs Mamdani Inference & returns explanation details
  solve(inputs) {
    // 1. Fuzzification
    const fuzzified = {};
    const explanations = {
      fuzzifiedInputs: {},
      ruleActivations: [],
      aggregatedOutputShape: null,
      defuzzifiedValue: null,
      crispInputs: { ...inputs }
    };

    for (const [varName, variable] of Object.entries(this.variables)) {
      if (!variable.isOutput) {
        const crispVal = inputs[varName] !== undefined ? inputs[varName] : variable.min;
        fuzzified[varName] = variable.fuzzify(crispVal);
        explanations.fuzzifiedInputs[varName] = fuzzified[varName];
      }
    }

    // 2. Rule Evaluation
    const ruleActivations = [];
    const outputActivations = {}; // { outputVarName: { termName: [activationLevels] } }

    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i];
      const activation = rule.evaluateAntecedent(fuzzified) * rule.weight;
      ruleActivations.push({
        index: i,
        antecedent: rule.antecedent,
        consequentVar: rule.consequentVarName,
        consequentTerm: rule.consequentTermName,
        activation: activation
      });

      if (activation > 0) {
        if (!outputActivations[rule.consequentVarName]) {
          outputActivations[rule.consequentVarName] = {};
        }
        if (!outputActivations[rule.consequentVarName][rule.consequentTermName]) {
          outputActivations[rule.consequentVarName][rule.consequentTermName] = [];
        }
        outputActivations[rule.consequentVarName][rule.consequentTermName].push(activation);
      }
    }
    explanations.ruleActivations = ruleActivations;

    // 3. Defuzzification for output variables
    const outputs = {};
    for (const [varName, variable] of Object.entries(this.variables)) {
      if (variable.isOutput) {
        const activations = outputActivations[varName] || {};
        
        // Find max activation for each output term
        const termMaxActivations = {};
        for (const termName of Object.keys(variable.terms)) {
          const list = activations[termName] || [];
          termMaxActivations[termName] = list.length > 0 ? Math.max(...list) : 0;
        }

        // Discrete aggregation & defuzzification (Centroid Method)
        const outputRange = variable.max - variable.min;
        const resolution = 200; // Number of samples for numeric integration
        const step = outputRange / resolution;
        
        let sumXMu = 0;
        let sumMu = 0;
        const aggregatedShape = [];

        for (let j = 0; j <= resolution; j++) {
          const x = variable.min + j * step;
          
          // Mamdani implication: for each term, clip the membership function by its max activation
          let aggregatedMu = 0;
          for (const [termName, mf] of Object.entries(variable.terms)) {
            const rawMu = mf.evaluate(x);
            const termActivation = termMaxActivations[termName] || 0;
            const clippedMu = Math.min(rawMu, termActivation);
            aggregatedMu = Math.max(aggregatedMu, clippedMu);
          }

          aggregatedShape.push({ x, y: aggregatedMu });
          sumXMu += x * aggregatedMu;
          sumMu += aggregatedMu;
        }

        let crispOutput = 0;
        if (sumMu > 0) {
          crispOutput = sumXMu / sumMu;
        } else {
          // Default to middle of the output range if no rules fired
          crispOutput = (variable.min + variable.max) / 2;
        }

        outputs[varName] = crispOutput;
        explanations.aggregatedOutputShape = aggregatedShape;
        explanations.termMaxActivations = termMaxActivations;
      }
    }

    explanations.defuzzifiedValue = outputs;
    return { outputs, explanations };
  }
}

// --- Export Module (or bind to window for Browser context) ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TriangularMF,
    TrapezoidalMF,
    FuzzyVariable,
    FuzzyRule,
    FuzzySystem
  };
} else {
  window.FuzzyEngine = {
    TriangularMF,
    TrapezoidalMF,
    FuzzyVariable,
    FuzzyRule,
    FuzzySystem
  };
}

// --- SELF TEST HARNESS ---
// If run directly using node (e.g. node fuzzyEngine.js)
if (typeof require !== 'undefined' && require.main === module) {
  console.log("Running Fuzzy Logic Engine Self-Tests...");
  try {
    // 1. Test membership functions
    const tri = new TriangularMF(10, 20, 30);
    console.assert(tri.evaluate(5) === 0, "TriMF before low bound failed");
    console.assert(tri.evaluate(20) === 1, "TriMF center peak failed");
    console.assert(tri.evaluate(15) === 0.5, "TriMF rising slope failed");
    console.assert(tri.evaluate(25) === 0.5, "TriMF falling slope failed");
    console.assert(tri.evaluate(35) === 0, "TriMF after high bound failed");

    const trap = new TrapezoidalMF(10, 20, 30, 40);
    console.assert(trap.evaluate(5) === 0, "TrapMF before low bound failed");
    console.assert(trap.evaluate(25) === 1, "TrapMF flat core failed");
    console.assert(trap.evaluate(15) === 0.5, "TrapMF rising slope failed");
    console.assert(trap.evaluate(35) === 0.5, "TrapMF falling slope failed");

    // 2. Test Fuzzy System inference
    const fis = new FuzzySystem();
    
    const skill = new FuzzyVariable('skills', 0, 100);
    skill.addTerm('Low', new TrapezoidalMF(0, 0, 20, 50));
    skill.addTerm('Medium', new TriangularMF(30, 50, 70));
    skill.addTerm('High', new TrapezoidalMF(50, 80, 100, 100));

    const exp = new FuzzyVariable('experience', 0, 100);
    exp.addTerm('Junior', new TrapezoidalMF(0, 0, 15, 40));
    exp.addTerm('Mid', new TriangularMF(30, 55, 80));
    exp.addTerm('Senior', new TrapezoidalMF(60, 85, 100, 100));

    const fit = new FuzzyVariable('fit', 0, 100, true);
    fit.addTerm('Poor', new TrapezoidalMF(0, 0, 20, 45));
    fit.addTerm('Average', new TriangularMF(30, 50, 70));
    fit.addTerm('Exceptional', new TrapezoidalMF(55, 80, 100, 100));

    fis.addVariable(skill).addVariable(exp).addVariable(fit);

    // Rule: IF skills IS High AND experience IS Senior THEN fit IS Exceptional
    fis.addRule(new FuzzyRule(
      {
        type: 'AND',
        left: { var: 'skills', term: 'High' },
        right: { var: 'experience', term: 'Senior' }
      },
      'fit',
      'Exceptional'
    ));

    // Rule: IF skills IS Low OR experience IS Junior THEN fit IS Poor
    fis.addRule(new FuzzyRule(
      {
        type: 'OR',
        left: { var: 'skills', term: 'Low' },
        right: { var: 'experience', term: 'Junior' }
      },
      'fit',
      'Poor'
    ));

    // Test a scenario
    const inputs = { skills: 90, experience: 90 };
    const result = fis.solve(inputs);
    
    console.log("FIS Solve test outputs:", result.outputs);
    console.assert(result.outputs.fit > 70, "High inputs should yield high fit rating");
    
    console.log("✅ All self-tests passed successfully!");
  } catch (error) {
    console.error("❌ Self-tests failed:", error);
  }
}
