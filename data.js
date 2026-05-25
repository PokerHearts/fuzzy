/**
 * Preloaded Data Models & Natural Language Summary Engine
 * Provides realistic HR datasets for resume screening and performance evaluations.
 * Implements client-side semantic matching between JDs, candidates, and previous employee benchmarks.
 * Contains URL crawlers heuristics and plain-English decision summarizers.
 */

const JOB_DESCRIPTIONS = {
  frontend_architect: {
    id: "frontend_architect",
    title: "Senior Frontend Architect",
    skills: ["javascript", "css", "html", "react", "performance", "architecture", "ux", "accessibility", "typescript", "testing", "webpack", "vite", "web components"],
    minExp: 8,
    prefEducation: "bachelor",
    culturalProfile: { collaboration: 90, adaptability: 85, leadership: 80 }
  },
  data_scientist: {
    id: "data_scientist",
    title: "Lead Data Scientist",
    skills: ["python", "machine learning", "pytorch", "tensorflow", "statistics", "sql", "pandas", "data engineering", "explainable ai", "transformers", "algorithms", "r", "spark"],
    minExp: 6,
    prefEducation: "master",
    culturalProfile: { collaboration: 75, adaptability: 90, leadership: 75 }
  },
  product_manager: {
    id: "product_manager",
    title: "Senior Technical Product Manager",
    skills: ["agile", "scrum", "roadmap", "user research", "analytics", "sql", "strategy", "market analysis", "wireframing", "jira", "communication", "product lifecycle"],
    minExp: 7,
    prefEducation: "bachelor",
    culturalProfile: { collaboration: 95, adaptability: 80, leadership: 90 }
  }
};

// Profiles of top-performing previous employees in each category (the historical gold standard)
const PREVIOUS_EMPLOYEES = {
  frontend_architect: [
    {
      name: "Alexandra Vance",
      tenure: "4 years",
      skills: ["javascript", "css", "html", "react", "typescript", "webpack", "performance", "architecture", "ux", "accessibility"],
      experience: 10,
      education: "bachelor",
      collaboration: 95,
      adaptability: 90,
      leadership: 85,
      performanceScore: 94
    },
    {
      name: "Marcus Aurelius Chen",
      tenure: "5 years",
      skills: ["javascript", "css", "react", "typescript", "vite", "performance", "architecture", "testing", "ux"],
      experience: 9,
      education: "master",
      collaboration: 88,
      adaptability: 85,
      leadership: 80,
      performanceScore: 91
    }
  ],
  data_scientist: [
    {
      name: "Dr. Elena Rostova",
      tenure: "3 years",
      skills: ["python", "machine learning", "pytorch", "statistics", "pandas", "explainable ai", "transformers", "algorithms"],
      experience: 8,
      education: "phd",
      collaboration: 80,
      adaptability: 95,
      leadership: 70,
      performanceScore: 96
    },
    {
      name: "David Kim",
      tenure: "4 years",
      skills: ["python", "machine learning", "tensorflow", "statistics", "sql", "pandas", "data engineering", "spark"],
      experience: 7,
      education: "master",
      collaboration: 85,
      adaptability: 88,
      leadership: 78,
      performanceScore: 90
    }
  ],
  product_manager: [
    {
      name: "Sophia Martinez",
      tenure: "5 years",
      skills: ["agile", "roadmap", "user research", "analytics", "strategy", "communication", "product lifecycle"],
      experience: 8,
      education: "master",
      collaboration: 98,
      adaptability: 85,
      leadership: 92,
      performanceScore: 95
    },
    {
      name: "John Carter",
      tenure: "3 years",
      skills: ["agile", "scrum", "roadmap", "analytics", "jira", "communication", "market analysis"],
      experience: 9,
      education: "bachelor",
      collaboration: 92,
      adaptability: 80,
      leadership: 88,
      performanceScore: 89
    }
  ]
};

// Simulated candidate directories (8 diverse mock candidates for bulk screening)
const CANDIDATES = [
  {
    id: "candidate_1",
    name: "Sarah Jenkins",
    targetRole: "frontend_architect",
    experience: 9,
    education: "master",
    collaboration: 90,
    adaptability: 85,
    leadership: 80,
    resumeText: `
SARAH JENKINS - SENIOR FRONTEND ENGINEER & ARCHITECT
Email: sarah.j@example.com | GitHub: github.com/sjenkins-dev

SUMMARY:
Highly experienced Frontend Architect with 9+ years of professional software engineering experience. Specializes in building accessible, high-performance web applications using JavaScript, HTML, CSS, React, and TypeScript. Expert in frontend performance optimization, micro-frontends, and design systems.

PROFESSIONAL EXPERIENCE:
Principal UI Engineer | TechGiant Inc. (2022 - Present)
- Led a team of 6 engineers to rebuild the core SaaS product using React and TypeScript, resulting in a 40% reduction in page load speed and improving the Largest Contentful Paint (LCP).
- Spearheaded the adoption of Web Components and Vite, reducing development build times by 65%.
- Implemented strict WCAG 2.1 AA accessibility (a11y) standards across the organization.

Senior Frontend Developer | InnovateWeb (2018 - 2022)
- Architected a shared design system using vanilla CSS, HTML, and React, maximizing reuse.
- Managed build configurations, optimizing Webpack bundles, and implementing code-splitting.
- Set up unit testing using Jest and automated integration testing workflows.

EDUCATION:
Master of Science in Computer Science | Boston University (2018)

TECHNICAL SKILLS:
Languages & Frameworks: JavaScript (ES6+), TypeScript, HTML5, CSS3, React, Next.js, Web Components
Tools & Performance: Webpack, Vite, Git, Jest, Testing Library, Chrome DevTools, Lighthouse, A11y, CSS Grid, Flexbox
    `
  },
  {
    id: "candidate_2",
    name: "Rohit Sharma",
    targetRole: "frontend_architect",
    experience: 5,
    education: "bachelor",
    collaboration: 82,
    adaptability: 88,
    leadership: 65,
    resumeText: `
ROHIT SHARMA - FRONTEND DEVELOPER
Email: rohit.sharma@example.com

SUMMARY:
Detail-oriented Frontend Developer with 5 years of experience creating highly responsive web interfaces. Proficient in React, JavaScript, and modern CSS frameworks. Eager to step into an architect role and design clean, maintainable systems.

PROFESSIONAL EXPERIENCE:
Software Engineer (Frontend) | WebCrafters (2021 - Present)
- Developed and maintained 15+ client web applications utilizing React and Redux Toolkit.
- Styled interfaces using modern CSS3, Sass, and responsive design systems.
- Improved SEO scores by restructure semantic HTML and optimizing image loading.

Junior Frontend Web Developer | DevStart Agency (2020 - 2021)
- Wrote basic code using JavaScript, HTML, CSS, and jQuery.
- Fixed layout and visual bugs across different browsers.
- Wrote unit tests and assisted in migrating legacy projects to React.

EDUCATION:
Bachelor of Technology in Information Technology | Delhi University (2020)

TECHNICAL SKILLS:
Skills: JavaScript, React, Redux, HTML, CSS, Git, Sass, Responsive Design, Firebase basics
    `
  },
  {
    id: "candidate_3",
    name: "James Miller",
    targetRole: "frontend_architect",
    experience: 2,
    education: "bachelor",
    collaboration: 70,
    adaptability: 72,
    leadership: 40,
    resumeText: `
JAMES MILLER - JUNIOR DESIGNER / DEVELOPER
Email: james.m@example.com

SUMMARY:
Creative designer and web designer transition to frontend development. Experienced in wireframing, UX design, and basic HTML/CSS. Strong aesthetic sense and basic coding capabilities.

EXPERIENCE:
Web Designer & Junior Developer | CreativePixels (2024 - Present)
- Designed landing pages in Figma and built them using simple HTML and CSS.
- Maintained company website and integrated social media APIs.
- Coordinated with marketing to design graphical assets.

EDUCATION:
Bachelor of Arts in Graphic Design | Academy of Art (2023)

TECHNICAL SKILLS:
Skills: HTML, CSS, WordPress, Figma, Photoshop, Illustrator, Basic JavaScript, Bootstrap
    `
  },
  {
    id: "candidate_4",
    name: "Emily Davis",
    targetRole: "data_scientist",
    experience: 7,
    education: "master",
    collaboration: 80,
    adaptability: 92,
    leadership: 70,
    resumeText: `
EMILY DAVIS - SENIOR DATA SCIENTIST & ML ENGINEER
Email: emily.davis@example.com

SUMMARY:
7+ years of experience analyzing massive datasets and deploying machine learning models. Expert in python, machine learning, pytorch, tensorflow, pandas, and statistical modeling.

EXPERIENCE:
Senior Data Scientist | DeepMind Labs (2021 - Present)
- Developed and deployed deep learning transformers models using PyTorch.
- Analyzed tabular data, built explainable ai metrics, and set up spark data pipelines.
- Directed a small team to build data engineering schemas in SQL.

EDUCATION:
Master of Science in Statistics | Stanford University (2019)

TECHNICAL SKILLS:
Skills: Python, Machine Learning, PyTorch, TensorFlow, Statistics, SQL, Pandas, Explainable AI, Spark
    `
  },
  {
    id: "candidate_5",
    name: "John Carter",
    targetRole: "product_manager",
    experience: 9,
    education: "bachelor",
    collaboration: 95,
    adaptability: 82,
    leadership: 88,
    resumeText: `
JOHN CARTER - TECHNICAL PRODUCT MANAGER
Email: carter.j@example.com

SUMMARY:
Results-driven Product Manager with 9 years of experience guiding agile software development cycles, setting roadmap strategies, and leading user research metrics.

EXPERIENCE:
Senior Product Manager | CloudNexus (2020 - Present)
- Managed core product agile lifecycle from wireframing to launch.
- Designed product roadmap, coordinated user research, and wrote strategy specs.
- Drafted Jira boards, ran daily scrum, and analyzed SQL data metrics.

EDUCATION:
Bachelor of Science in Business Admin | NYU (2017)

TECHNICAL SKILLS:
Skills: Agile, Scrum, Roadmap, User Research, Analytics, SQL, Strategy, Jira, Communication, Product Lifecycle
    `
  },
  {
    id: "candidate_6",
    name: "Alice Wonderland",
    targetRole: "frontend_architect",
    experience: 3,
    education: "bachelor",
    collaboration: 85,
    adaptability: 80,
    leadership: 50,
    resumeText: `
ALICE WONDERLAND - JUNIOR FRONTEND ENGINEER
Email: alice@wonderland.dev

SUMMARY:
Passionate React developer with 3 years experience. Skilled in modern CSS, HTML5, React hooks, and Basic JavaScript. Eager to grow as a Frontend Architect.

EXPERIENCE:
Junior Web Developer | TechStart (2023 - Present)
- Built modular React components.
- Maintained web designs using custom CSS and HTML.
- Utilized Git for version control.

EDUCATION:
Bachelor of Science in Software Engineering | UT Austin (2023)

TECHNICAL SKILLS:
Skills: React, JavaScript, HTML, CSS, Git, Webpack, Responsive Design
    `
  },
  {
    id: "candidate_7",
    name: "Bob Builder",
    targetRole: "frontend_architect",
    experience: 11,
    education: "bachelor",
    collaboration: 65,
    adaptability: 70,
    leadership: 60,
    resumeText: `
BOB BUILDER - DEVOPS ENGINEER & SYSTEMS ARCHITECT
Email: bob.b@sysops.com

SUMMARY:
11+ years of managing cloud infrastructure, Linux servers, CI/CD pipelines, Docker, Kubernetes, and AWS systems. Minimal experience with frontend layouts.

EXPERIENCE:
Lead DevOps Architect | SysOps Solutions (2018 - Present)
- Managed AWS kubernetes clusters, Docker containers, and CI/CD pipelines.
- Wrote automation scripts in Python and Bash.
- Monitored network security and load balancing.

TECHNICAL SKILLS:
Skills: Python, Linux, AWS, Kubernetes, Docker, CI/CD, Git, Scripting, SQL
    `
  },
  {
    id: "candidate_8",
    name: "Charlie Brown",
    targetRole: "product_manager",
    experience: 4,
    education: "bachelor",
    collaboration: 90,
    adaptability: 75,
    leadership: 70,
    resumeText: `
CHARLIE BROWN - PRODUCT OWNER / MANAGER
Email: charlie@brown-consulting.com

SUMMARY:
Product Owner with 4 years experience leading software sprints, drafting user stories, and managing roadmaps.

EXPERIENCE:
Product Owner | SprintConsult (2022 - Present)
- Collaborated in an agile scrum team to write user research briefs.
- Created Jira tickets and managed product backlog roadmaps.
- Coordinated strategy briefs and communications with clients.

EDUCATION:
Bachelor of Arts in Communications | UCLA (2021)

TECHNICAL SKILLS:
Skills: Agile, Scrum, Jira, Roadmap, User Research, Communication, Product Lifecycle
    `
  }
];

// Existing Employee Datasets for Performance Analytics
const EXISTING_EMPLOYEES = [
  {
    id: "emp_101",
    name: "Rachel Green",
    role: "Senior Software Engineer",
    productivity: 92,
    quality: 94,
    collaboration: 95,
    adaptability: 88,
    autonomy: 90,
    tenure: "3.5 years"
  },
  {
    id: "emp_102",
    name: "Chandler Bing",
    role: "Lead Systems Analyst",
    productivity: 82,
    quality: 85,
    collaboration: 90,
    adaptability: 80,
    autonomy: 85,
    tenure: "5 years"
  },
  {
    id: "emp_103",
    name: "Joey Tribbiani",
    role: "Junior Web Developer",
    productivity: 65,
    quality: 58,
    collaboration: 85,
    adaptability: 70,
    autonomy: 45,
    tenure: "1 year"
  },
  {
    id: "emp_104",
    name: "Monica Geller",
    role: "QA Director",
    productivity: 98,
    quality: 99,
    collaboration: 78,
    adaptability: 82,
    autonomy: 95,
    tenure: "4 years"
  },
  {
    id: "emp_105",
    name: "Phoebe Buffay",
    role: "UX Researcher",
    productivity: 75,
    quality: 80,
    collaboration: 96,
    adaptability: 94,
    autonomy: 70,
    tenure: "2 years"
  }
];

const RESTAURANTS = [
  {
    id: "restaurant_1",
    name: "Toscano Italian Bistro",
    url: "https://toscano-bistro.example.com",
    cuisine: "Italian",
    distance: 1.8,
    price: 3,
    reviews: "Toscano is absolutely spectacular! The handmade fettuccine and truffle pasta were delicious. Service was incredibly fast and welcoming. The cozy outdoor seating creates a wonderful atmosphere. It is a bit expensive but totally worth it. Will definitely return for another amazing dinner!"
  },
  {
    id: "restaurant_2",
    name: "Sakura Zen Sushi",
    url: "https://sakurazensushi.example.com",
    cuisine: "Sushi",
    distance: 5.4,
    price: 4,
    reviews: "Great authentic sushi, very fresh sashimi! However, the service is extremely slow and crowded on weekends. The tables were slightly dirty. Overpriced for what you get, although the chef's special rolls are indeed amazing. A good experience but the noise was annoying."
  },
  {
    id: "restaurant_3",
    name: "Tikka Express Curry",
    url: "https://tikkaexpress-curry.example.com",
    cuisine: "Indian",
    distance: 0.6,
    price: 1,
    reviews: "Super quick and cheap curry spot! The butter chicken and garlic naan are average but hit the spot. It is quite noisy and crowded, and the tables are messy and dirty. Not a romantic place at all, but highly convenient and very fast. Good value but lacks service quality."
  }
];

// --- Mock JD URL Crawler & Sentiment Parser ---

/**
 * Heuristic crawler for LinkedIn/Naukri URLs.
 * Automatically identifies roles based on keywords and returns target constraints.
 */
function parseJDFromUrl(url) {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes("react") || urlLower.includes("frontend") || urlLower.includes("developer") || urlLower.includes("architect")) {
    return {
      title: "Extracted: Senior Frontend Engineer",
      skills: ["javascript", "css", "html", "react", "typescript", "webpack", "performance", "architecture", "ux", "accessibility"],
      minExp: 7,
      prefEducation: "bachelor"
    };
  }
  
  if (urlLower.includes("data") || urlLower.includes("science") || urlLower.includes("machine") || urlLower.includes("ml") || urlLower.includes("ai")) {
    return {
      title: "Extracted: ML Data Scientist",
      skills: ["python", "machine learning", "pytorch", "tensorflow", "statistics", "pandas", "data engineering", "sql"],
      minExp: 6,
      prefEducation: "master"
    };
  }
  
  if (urlLower.includes("product") || urlLower.includes("manager") || urlLower.includes("agile") || urlLower.includes("scrum")) {
    return {
      title: "Extracted: Technical Product Manager",
      skills: ["agile", "scrum", "roadmap", "user research", "analytics", "jira", "strategy", "communication"],
      minExp: 8,
      prefEducation: "bachelor"
    };
  }
  
  // Default fallback JD if url is general
  return {
    title: "Extracted: Software Engineer (General)",
    skills: ["javascript", "python", "sql", "git", "html", "css", "agile", "communication"],
    minExp: 5,
    prefEducation: "bachelor"
  };
}

/**
 * Natural language positive/negative sentiment analyser.
 */
function analyzeReviewSentiment(text) {
  if (!text) return { score: 50, positives: [], negatives: [] };
  
  const positivesDict = ["spectacular", "delicious", "amazing", "fresh", "quick", "clean", "wonderful", "authentic", "friendly", "love", "excel", "outstanding", "great", "excellent", "worth", "convenient", "value", "welcoming", "cozy"];
  const negativesDict = ["slow", "dirty", "overpriced", "crowded", "noisy", "annoying", "messy", "bad", "expensive", "poor", "average", "disappointed", "lacks", "worst", "rude", "cheap"];
  
  const textNormalized = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  const words = textNormalized.split(/\s+/);
  
  const matchedPos = [];
  const matchedNeg = [];
  
  words.forEach(word => {
    if (positivesDict.includes(word) && !matchedPos.includes(word)) {
      matchedPos.push(word);
    }
    if (negativesDict.includes(word) && !matchedNeg.includes(word)) {
      matchedNeg.push(word);
    }
  });

  let score = 50 + (matchedPos.length * 7) - (matchedNeg.length * 7);
  score = Math.max(0, Math.min(100, score));

  return { score, positives: matchedPos, negatives: matchedNeg };
}

// --- Dynamic Plain-English Decision Explainer Narrative ---

/**
 * Generates an easy-to-read, comprehensive, non-technical plain English summary
 * explaining exactly why the candidate got their compatibility rating.
 */
function generateDecisionSummary(name, inputs, finalScore, jdTitle) {
  let recommendation = "";
  let verdictColor = "";

  if (finalScore >= 72) {
    recommendation = "<strong>Exceptional Fit (HIRE)</strong>";
    verdictColor = "emerald";
  } else if (finalScore >= 45) {
    recommendation = "<strong>Average Match (SCREEN CALL)</strong>";
    verdictColor = "amber";
  } else {
    recommendation = "<strong>Poor Alignment (REJECT)</strong>";
    verdictColor = "rose";
  }

  // Experience assessment text
  let expEvaluation = "";
  if (inputs.experience >= 8) {
    expEvaluation = `possesses deep senior-level experience (${inputs.experience} years), which highly exceeds the standard requirements`;
  } else if (inputs.experience >= 5) {
    expEvaluation = `holds a solid mid-level experience baseline (${inputs.experience} years), meeting primary specifications`;
  } else {
    expEvaluation = `has junior-level experience (${inputs.experience} years), which represents a significant maturity gap for this position`;
  }

  // Skills overlap assessment
  let skillsEvaluation = "";
  if (inputs.skills >= 80) {
    skillsEvaluation = `an outstanding <strong>${inputs.skills}% matching score</strong>, indicating mastery of the required tools and technical skills`;
  } else if (inputs.skills >= 45) {
    skillsEvaluation = `a moderate <strong>${inputs.skills}% matching score</strong>, showing they know the basics but have noticeable skills gaps`;
  } else {
    skillsEvaluation = `a critical <strong>${inputs.skills}% match score</strong>, missing the vast majority of requested technical capabilities`;
  }

  // Cosine benchmark assessment
  let alignmentEvaluation = "";
  if (inputs.alignment >= 75) {
    alignmentEvaluation = `aligns extremely closely (<strong>${inputs.alignment}% similarity</strong>) with the core profiles of your top-performing successful employees in this role`;
  } else if (inputs.alignment >= 45) {
    alignmentEvaluation = `shows moderate alignment (<strong>${inputs.alignment}% similarity</strong>) with historical successful hires`;
  } else {
    alignmentEvaluation = `exhibits low baseline correlation (<strong>${inputs.alignment}% similarity</strong>) with successful staff parameters`;
  }

  // Culture fit
  let cultureEvaluation = "";
  if (inputs.culture >= 75) {
    cultureEvaluation = "excellent soft skills and cultural synergy";
  } else if (inputs.culture >= 50) {
    cultureEvaluation = "satisfactory interpersonal teamwork baseline";
  } else {
    cultureEvaluation = "poor teamwork alignment or potential individualistic friction risks";
  }

  // Education rank
  let eduLabel = "Adequate";
  if (inputs.education >= 85) eduLabel = "Exceptional (Masters/PhD)";
  else if (inputs.education < 50) eduLabel = "Limited";

  return `
    <strong>Recruitment Verdict:</strong> ${recommendation} with an overall Fuzzy Match of <strong>${finalScore.toFixed(1)}%</strong> for the <strong>${jdTitle}</strong> role.
    <br><br>
    <strong>Core Rationale:</strong>
    <ul>
      <li><strong>Technical Expertise:</strong> ${name} displays ${skillsEvaluation}.</li>
      <li><strong>Work History:</strong> The candidate ${expEvaluation}.</li>
      <li><strong>Benchmark Performance Alignment:</strong> Their experience profile ${alignmentEvaluation}.</li>
      <li><strong>Culture & Soft Skills:</strong> Wrote evaluation demonstrates ${cultureEvaluation}.</li>
      <li><strong>Education Credentials:</strong> Academic background is rated as <strong>${eduLabel}</strong>.</li>
    </ul>
    <br>
    <strong>HR Next Step Action:</strong> ${
      finalScore >= 72 
        ? "Fast-track this candidate immediately to technical interview stages. Their profile represents a gold-standard benchmark match." 
        : finalScore >= 45 
        ? "Schedule a 30-minute HR phone screen call. Focus questions on resolving their missing skill sets and verifying their growth path." 
        : "Send standard rejection correspondence. Their profile exhibits significant alignment gaps across primary structural criteria."
    }
  `;
}

// --- Text Overlap Parser Helper ---
function parseResumeSkills(resumeText, jdSkills) {
  if (!resumeText) return { matched: [], percent: 0, missing: jdSkills };
  
  const textNormalized = resumeText.toLowerCase();
  const matched = [];
  const missing = [];
  
  jdSkills.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:\\b|\\s|/)${escaped}(?:\\b|\\s|/|,)`, 'i');
    
    if (regex.test(textNormalized)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const percent = Math.round((matched.length / jdSkills.length) * 100);
  return { matched, percent, missing };
}

function calculateHistoricalAlignment(candidateSkills, roleId) {
  const benchmarks = PREVIOUS_EMPLOYEES[roleId] || PREVIOUS_EMPLOYEES["frontend_architect"];
  if (!benchmarks || benchmarks.length === 0) return 50;

  const benchmarkSkillsUnionSet = new Set();
  benchmarks.forEach(emp => {
    emp.skills.forEach(s => benchmarkSkillsUnionSet.add(s));
  });
  const unionSkills = Array.from(benchmarkSkillsUnionSet);
  if (unionSkills.length === 0) return 50;

  const benchmarkVec = unionSkills.map(skill => {
    let count = 0;
    benchmarks.forEach(emp => {
      if (emp.skills.includes(skill)) count++;
    });
    return count / benchmarks.length;
  });

  const candidateVec = unionSkills.map(skill => {
    return candidateSkills.includes(skill) ? 1 : 0;
  });

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < unionSkills.length; i++) {
    dotProduct += candidateVec[i] * benchmarkVec[i];
    normA += candidateVec[i] * candidateVec[i];
    normB += benchmarkVec[i] * benchmarkVec[i];
  }

  if (normA === 0 || normB === 0) return 30;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.round(similarity * 100);
}

function getEducationMatchScore(candEdu, reqEdu) {
  const eduRank = { none: 0, high_school: 20, associate: 40, bachelor: 60, master: 85, phd: 100 };
  const candRank = eduRank[candEdu.toLowerCase()] || 40;
  const reqRank = eduRank[reqEdu.toLowerCase()] || 60;
  
  if (candRank >= reqRank) {
    return 90 + Math.min(10, (candRank - reqRank));
  } else {
    return Math.max(30, 90 - (reqRank - candRank) * 1.5);
  }
}

// --- Bind to window/exports ---
const Data = {
  JOB_DESCRIPTIONS,
  PREVIOUS_EMPLOYEES,
  CANDIDATES,
  EXISTING_EMPLOYEES,
  RESTAURANTS,
  parseResumeSkills,
  calculateHistoricalAlignment,
  getEducationMatchScore,
  analyzeReviewSentiment,
  parseJDFromUrl,
  generateDecisionSummary
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Data;
} else {
  window.HRData = Data;
}
