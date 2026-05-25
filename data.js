/**
 * Preloaded Data Mocks & Skill Overlap/Cosine Similarity Engine
 * Provides realistic HR datasets for resume screening and performance evaluations.
 * Implements client-side semantic matching between JDs, candidates, and previous employee benchmarks.
 */

const JOB_DESCRIPTIONS = {
  frontend_architect: {
    id: "frontend_architect",
    title: "Senior Frontend Architect",
    skills: ["javascript", "css", "html", "react", "performance", "architecture", "ux", "accessibility", "typescript", "testing", "webpack", "vite", "web components"],
    minExp: 8,
    prefEducation: "bachelor", // bachelor, master, phd
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

// Sample candidates with detailed simulated resumes for screening
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
- Built interactive features using JavaScript, HTML, CSS, and jQuery.
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

// --- Skill Parsing & Cosine Similarity Engines ---

/**
 * Parses resume text to find overlapping skills listed in the Job Description.
 * Returns overlapping list, matched percentage, and missing skills.
 */
function parseResumeSkills(resumeText, jdSkills) {
  if (!resumeText) return { matched: [], percent: 0, missing: jdSkills };
  
  const textNormalized = resumeText.toLowerCase();
  const matched = [];
  const missing = [];
  
  jdSkills.forEach(skill => {
    // Escape special characters in skill name for regex matching (e.g. C++, .net)
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Look for word boundaries or isolated occurrences
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

/**
 * Calculates Cosine Similarity between a candidate's skill set and
 * the aggregated skill profile of top-performing previous employees.
 * Vector representation: binary vector of matches across all union skills.
 */
function calculateHistoricalAlignment(candidateSkills, roleId) {
  const benchmarks = PREVIOUS_EMPLOYEES[roleId];
  if (!benchmarks || benchmarks.length === 0) return 50; // Default baseline if no reference

  // 1. Gather all unique skills from previous top employees in this role
  const benchmarkSkillsUnionSet = new Set();
  benchmarks.forEach(emp => {
    emp.skills.forEach(s => benchmarkSkillsUnionSet.add(s));
  });
  const unionSkills = Array.from(benchmarkSkillsUnionSet);
  if (unionSkills.length === 0) return 50;

  // 2. Build Average Benchmark Vector
  const benchmarkVec = unionSkills.map(skill => {
    let count = 0;
    benchmarks.forEach(emp => {
      if (emp.skills.includes(skill)) count++;
    });
    return count / benchmarks.length; // Average presence of this skill (0 to 1)
  });

  // 3. Build Candidate Vector
  const candidateVec = unionSkills.map(skill => {
    return candidateSkills.includes(skill) ? 1 : 0;
  });

  // 4. Calculate Cosine Similarity
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < unionSkills.length; i++) {
    dotProduct += candidateVec[i] * benchmarkVec[i];
    normA += candidateVec[i] * candidateVec[i];
    normB += benchmarkVec[i] * benchmarkVec[i];
  }

  if (normA === 0 || normB === 0) return 30; // low baseline alignment

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  // Return scale normalized to [0, 100]
  return Math.round(similarity * 100);
}

/**
 * Evaluates the candidate's Education Match score.
 * Minimum target mapping: bachelor -> 50, master -> 80, phd -> 100
 */
function getEducationMatchScore(candEdu, reqEdu) {
  const eduRank = { none: 0, high_school: 20, associate: 40, bachelor: 60, master: 85, phd: 100 };
  const candRank = eduRank[candEdu.toLowerCase()] || 40;
  const reqRank = eduRank[reqEdu.toLowerCase()] || 60;
  
  if (candRank >= reqRank) {
    // Exceeds or meets
    return 90 + Math.min(10, (candRank - reqRank));
  } else {
    // Penalty for not meeting
    return Math.max(30, 90 - (reqRank - candRank) * 1.5);
  }
}

const RESTAURANTS = [
  {
    id: "restaurant_1",
    name: "Toscano Italian Bistro",
    url: "https://toscano-bistro.example.com",
    cuisine: "Italian",
    distance: 1.8, // km
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

  // Calculate rating: base 50, +6 for each unique positive, -6 for each unique negative
  let score = 50 + (matchedPos.length * 7) - (matchedNeg.length * 7);
  score = Math.max(0, Math.min(100, score));

  return { score, positives: matchedPos, negatives: matchedNeg };
}

// --- Bind to exports/window ---
const Data = {
  JOB_DESCRIPTIONS,
  PREVIOUS_EMPLOYEES,
  CANDIDATES,
  EXISTING_EMPLOYEES,
  RESTAURANTS,
  parseResumeSkills,
  calculateHistoricalAlignment,
  getEducationMatchScore,
  analyzeReviewSentiment
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Data;
} else {
  window.HRData = Data;
}
