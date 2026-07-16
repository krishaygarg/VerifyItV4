import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../verifyit_ai.db');

const QUESTIONS_DATA = [
  {
    id: "ai_q1",
    title: "AI and Deepfakes in Elections",
    categories: "News Literacy",
    content: `<h3>Can you identify deepfakes?</h3><p>In 2024, a robocall mimicking a prominent U.S. political leader's voice urged residents not to vote in a primary election [1]. This was one of the first major uses of generative AI to directly disrupt voter turnout.</p><p>Is generative artificial intelligence currently subject to strict, comprehensive federal laws in the United States that criminalize all political deepfakes?</p>`,
    choices: `<ol>
	<li>Yes</li>
	<li>No</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>No, there is currently no comprehensive federal law criminalizing political deepfakes. While some states have passed laws targeting election-related deepfakes, federal regulation remains limited, and courts are balancing regulations against First Amendment free speech protections.</p>`,
    hints: `<ol>
	<li>Source: Federal Communications Commission (FCC) Robocall Ruling</li>
</ol>`
  },
  {
    id: "ai_q2",
    title: "Social Media Echo Chambers",
    categories: "News Literacy",
    content: `<h3>Algorithms and confirmation bias</h3><p>Many social media platforms prioritize user engagement. Algorithms are designed to show content that aligns with what users have previously liked or shared [1]. This pattern can create online "echo chambers".</p><p>True or False: Social media algorithms are legally required to verify the truth of news articles before recommending them to your feed.</p>`,
    choices: `<ol>
	<li>True</li>
	<li>False</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>False! Social media platforms are generally not legally required to verify the truth of posts before algorithms recommend them. Under Section 230 of the Communications Decency Act [2], platforms are protected from liability for user-generated content, though many voluntarily employ third-party fact-checkers.</p>`,
    hints: `<ol>
	<li>Source: Pew Research Center Algorithm Study</li>
	<li>Source: Section 230 Communications Decency Act</li>
</ol>`
  },
  {
    id: "ai_q3",
    title: "The 26th Amendment and Voting Age",
    categories: "Voting Rights; Civics",
    content: `<h3>The voting age limit</h3><p>The 26th Amendment was ratified in 1971 during the Vietnam War, driven by the slogan "old enough to fight, old enough to vote" [1].</p><p>What is the minimum voting age for federal elections established by the 26th Amendment?</p>`,
    choices: `<ol>
	<li>16 years old</li>
	<li>18 years old</li>
	<li>21 years old</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>The 26th Amendment lowered the voting age from 21 to 18. Young Americans argued that if they could be drafted to fight in wars, they should have the democratic right to vote for their leaders.</p>`,
    hints: `<ol>
	<li>Source: U.S. National Archives - 26th Amendment</li>
</ol>`
  },
  {
    id: "ai_q4",
    title: "The Electoral College Votes",
    categories: "Civics",
    content: `<h3>How presidential votes are counted</h3><p>The President of the United States is not elected by popular vote directly, but by electors representing the Electoral College [1].</p><p>How many total electoral votes are there in the U.S. Electoral College, and how many are needed to win?</p>`,
    choices: `<ol>
	<li>435 total, 218 to win</li>
	<li>538 total, 270 to win</li>
	<li>100 total, 51 to win</li>
	<li>500 total, 250 to win</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>There are 538 total electors in the Electoral College (representing 435 Representatives, 100 Senators, and 3 electors for Washington D.C.). A candidate must win a majority of 270 votes to win the presidency.</p>`,
    hints: `<ol>
	<li>Source: U.S. Constitution, Article II and 23rd Amendment</li>
</ol>`
  },
  {
    id: "ai_q5",
    title: "Fact-Checking with Lateral Reading",
    categories: "News Literacy",
    content: `<h3>Evaluating unfamiliar sources</h3><p>When professional fact-checkers land on an unfamiliar website, they don't just read the page. Instead, they open new tabs to search for what *other* trusted sources say about that site [1]. This is called "lateral reading".</p><p>True or False: Staying on a single page to read its "About Us" section is the most reliable way to confirm its truthfulness.</p>`,
    choices: `<ol>
	<li>True</li>
	<li>False</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>False! Bad actors can easily create official-looking "About Us" pages. Fact-checkers recommend lateral reading—leaving the site and looking at external reviews, Wikipedia, or news mentions to evaluate credibility.</p>`,
    hints: `<ol>
	<li>Source: Stanford History Education Group (SHEG)</li>
</ol>`
  },
  {
    id: "ai_q6",
    title: "Voter Registration Rules",
    categories: "Voting Rights",
    content: `<h3>Same-Day Voter Registration</h3><p>Some states allow eligible citizens to register to vote and cast their ballot on the same day, including on Election Day [1]. This is called Same-Day Registration (SDR).</p><p>True or False: All states in the U.S. are legally required to offer Same-Day Voter Registration for presidential elections.</p>`,
    choices: `<ol>
	<li>True</li>
	<li>False</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>False! While Same-Day Voter Registration increases turnout, it is not a federal requirement. Each state regulates its own voting registration deadlines, with some requiring registration weeks in advance.</p>`,
    hints: `<ol>
	<li>Source: National Conference of State Legislatures (NCSL)</li>
</ol>`
  },
  {
    id: "ai_q7",
    title: "The Three Branches of Government",
    categories: "Civics",
    content: `<h3>Separation of Powers</h3><p>The U.S. Constitution divides the federal government into three branches to ensure checks and balances [1].</p><p>Which branch of government is responsible for making laws?</p>`,
    choices: `<ol>
	<li>Legislative Branch</li>
	<li>Executive Branch</li>
	<li>Judicial Branch</li>
</ol>`,
    correct_choice: 1,
    followup: `<p>The Legislative Branch (Congress) makes laws. The Executive Branch (President) enforces laws, and the Judicial Branch (Supreme Court) interprets laws.</p>`,
    hints: `<ol>
	<li>Source: U.S. Constitution, Article I</li>
</ol>`
  },
  {
    id: "ai_q8",
    title: "Recognizing Native Advertising",
    categories: "News Literacy",
    content: `<h3>Identifying sponsored content</h3><p>Native advertising is a form of paid content designed to look exactly like the surrounding news articles, editorial reports, or social media posts [1].</p><p>True or False: If an article looks like a normal news report, it is guaranteed to be unbiased journalism.</p>`,
    choices: `<ol>
	<li>True</li>
	<li>False</li>
</ol>`,
    correct_choice: 2,
    followup: `<p>False! Sponsored content or native ads are paid promotions that mimic news stories to gain reader trust. Look for labels like "Sponsored," "Promoted," or "Ad" near the title.</p>`,
    hints: `<ol>
	<li>Source: Federal Trade Commission (FTC) Native Advertising Guide</li>
</ol>`
  },
  {
    id: "ai_q9",
    title: "Constitutional Right to Vote",
    categories: "Voting Rights; Civics",
    content: `<h3>Voting protections in the Constitution</h3><p>The U.S. Constitution does not explicitly grant a positive right to vote, but contains amendments that prohibit states from denying the right based on specific factors [1].</p><p>Which amendment lowered the voting age to 18 and prohibited age-based discrimination for anyone 18 and older?</p>`,
    choices: `<ol>
	<li>15th Amendment</li>
	<li>19th Amendment</li>
	<li>26th Amendment</li>
	<li>24th Amendment</li>
</ol>`,
    correct_choice: 3,
    followup: `<p>The 26th Amendment (1971) states that the right of citizens 18 years or older to vote shall not be denied or abridged by the United States or by any State on account of age.</p>`,
    hints: `<ol>
	<li>Source: U.S. Constitution, 26th Amendment</li>
</ol>`
  }
];

function createDatabase() {
  try {
    console.log(`Creating/opening verifyit_ai.db SQLite database at: ${dbPath}`);
    const db = new DatabaseSync(dbPath);
    
    // Create question table matching schema of verifyit.db
    db.exec(`
      CREATE TABLE IF NOT EXISTS question (
        question_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        question_categories TEXT,
        question_content TEXT NOT NULL,
        followup TEXT,
        choices TEXT NOT NULL,
        correct_choice INTEGER NOT NULL,
        hints TEXT,
        status_name TEXT DEFAULT 'published',
        author TEXT DEFAULT 'AI',
        last_mod_by TEXT DEFAULT 'AI',
        created TEXT,
        last_modified TEXT
      )
    `);
    
    console.log('Created question table successfully.');
    
    // Delete existing questions if any to reload fresh
    db.exec('DELETE FROM question');
    
    const insertStmt = db.prepare(`
      INSERT INTO question (
        question_id, title, question_categories, question_content, followup, choices, correct_choice, hints, created, last_modified
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `);
    
    for (const q of QUESTIONS_DATA) {
      insertStmt.run(q.id, q.title, q.categories, q.content, q.followup, q.choices, q.correct_choice, q.hints);
      console.log(`Inserted question: ${q.title}`);
    }
    
    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

createDatabase();
