export const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    category: "Civics",
    text: "How many amendments does the U.S. Constitution have?",
    type: "multiple-choice",
    options: [
      { id: "a", text: "10" },
      { id: "b", text: "27" },
      { id: "c", text: "50" },
      { id: "d", text: "100" }
    ],
    correctAnswer: "b",
    explanation: "The Constitution was written in 1787 and has been amended 27 times. The first 10 amendments are known as the Bill of Rights."
  },
  {
    id: "q2",
    category: "Civics",
    text: "What is the supreme law of the land in the United States?",
    type: "multiple-choice",
    options: [
      { id: "a", text: "The Declaration of Independence" },
      { id: "b", text: "The Constitution" },
      { id: "c", text: "The Articles of Confederation" },
      { id: "d", text: "The Federal Register" }
    ],
    correctAnswer: "b",
    explanation: "The U.S. Constitution is the supreme law, and all other state and federal laws must comply with it."
  },
  {
    id: "q3",
    category: "News Literacy",
    text: "What does the term 'Confirmation Bias' mean?",
    type: "multiple-choice",
    options: [
      { id: "a", text: "Double-checking sources before sharing news online." },
      { id: "b", text: "The tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs." },
      { id: "c", text: "Trusting only verified journalists on official social media channels." },
      { id: "d", text: "Automatically rejecting any news from mainstream networks." }
    ],
    correctAnswer: "b",
    explanation: "Confirmation bias is a cognitive bias that makes people favor information aligning with their existing views, making them more vulnerable to false news."
  },
  {
    id: "q4",
    category: "News Literacy",
    text: "A sensational headline states: 'Breaking: Local Mayor Bans Puppies in City Limits!' The article has no quotes, no author name, and links to an untraceable blog. What is the best first step to verify this?",
    type: "multiple-choice",
    options: [
      { id: "a", text: "Share it immediately to warn your friends and neighbors." },
      { id: "b", text: "Leave an angry comment on the blog post." },
      { id: "c", text: "Search for the story on trusted local news outlets or check the official city website." },
      { id: "d", text: "Assume the mayor did it but is trying to hide it." }
    ],
    correctAnswer: "c",
    explanation: "Lateral reading—checking other reliable sources—is the fastest way to confirm whether a sensational claim is true or fabricated."
  },
  {
    id: "q5",
    category: "Voting Rights",
    text: "In all U.S. states, you must register to vote at least 30 days before Election Day.",
    type: "boolean",
    options: [
      { id: "t", text: "True" },
      { id: "f", text: "False" }
    ],
    correctAnswer: "f",
    explanation: "Voter registration deadlines vary widely by state. Some states allow same-day voter registration on Election Day, while others require registering up to 30 days in advance."
  },
  {
    id: "q6",
    category: "Voting Rights",
    text: "Which constitutional amendment granted women the right to vote in the United States?",
    type: "multiple-choice",
    options: [
      { id: "a", text: "14th Amendment" },
      { id: "b", text: "15th Amendment" },
      { id: "c", text: "19th Amendment" },
      { id: "d", text: "26th Amendment" }
    ],
    correctAnswer: "c",
    explanation: "Ratified in 1920, the 19th Amendment prohibits states and the federal government from denying the right to vote on the basis of sex."
  }
];
