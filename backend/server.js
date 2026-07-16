import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDbPath = (filename) => {
  const localPath = path.resolve(__dirname, filename);
  const parentPath = path.resolve(__dirname, '../', filename);
  return fs.existsSync(localPath) ? localPath : parentPath;
};
const dbPath = getDbPath('verifyit.db');

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Fallback Questions Database (used if verifyit.db cannot be loaded)
const FALLBACK_QUESTIONS = [
  {
    id: "q1",
    categories: ["Civics"],
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
    categories: ["Civics"],
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
    categories: ["News Literacy"],
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
  }
];

let QUESTIONS = [];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseChoices(choicesHtml) {
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  const matches = [];
  let match;
  while ((match = liRegex.exec(choicesHtml)) !== null) {
    const cleanText = decodeHtmlEntities(match[1].replace(/<[^>]*>/g, '').trim());
    matches.push({
      id: String.fromCharCode(97 + matches.length), // a, b, c, d
      text: cleanText
    });
  }
  return matches;
}

function getMappedCategories(catStr) {
  if (!catStr) return ['Civics'];
  const categories = [];
  const normalized = catStr.toLowerCase();
  
  if (normalized.includes('civic') || normalized.includes('constitution') || normalized.includes('amendment') || normalized.includes('government')) {
    categories.push('Civics');
  }
  if (normalized.includes('news') || normalized.includes('literacy') || normalized.includes('disinformation') || normalized.includes('bias') || normalized.includes('media') || normalized.includes('fact')) {
    categories.push('News Literacy');
  }
  if (normalized.includes('vote') || normalized.includes('voting') || normalized.includes('voter') || normalized.includes('election') || normalized.includes('suppression')) {
    categories.push('Voting Rights');
  }
  
  if (categories.length === 0) {
    categories.push('Civics');
  }
  return categories;
}

function cleanHtml(htmlStr) {
  if (!htmlStr) return '';
  let clean = htmlStr.replace(/<\/?span[^>]*>/gi, '');
  clean = clean.replace(/\s*(?:style|class|align|face|color|size|height|width)="[^"]*"/gi, '');
  clean = clean.replace(/\s*(?:style|class|align|face|color|size|height|width)='[^']*'/gi, '');
  clean = clean.replace(/<h[12][^>]*>/gi, '<h3>').replace(/<\/h[12]>/gi, '</h3>');
  clean = clean.replace(/<p>\s*(?:&nbsp;|<br\s*\/?>)*\s*<\/p>/gi, '');
  return clean.trim();
}

function injectHints(htmlStr, hints) {
  if (!htmlStr || !hints || hints.length === 0) return htmlStr;
  let result = htmlStr;
  hints.forEach((hintText, index) => {
    const hintNum = index + 1;
    const regex = new RegExp(`\\[\\s*${hintNum}\\s*\\]`, 'g');
    result = result.replace(regex, `<span class="hint-tooltip" data-hint="${hintText.replace(/"/g, '&quot;')}">[${hintNum}]</span>`);
  });
  return result;
}

let dbOriginal = null;
let dbAi = null;

function initDatabaseConnections() {
  try {
    const originalFile = getDbPath('verifyit.db');
    if (fs.existsSync(originalFile)) {
      dbOriginal = new DatabaseSync(originalFile);
      console.log('Opened persistent connection to verifyit.db');
    }
  } catch (err) {
    console.error('Failed to open verifyit.db:', err.message);
  }
  
  try {
    const aiFile = getDbPath('verifyit_ai.db');
    if (fs.existsSync(aiFile)) {
      dbAi = new DatabaseSync(aiFile);
      console.log('Opened persistent connection to verifyit_ai.db');
    }
  } catch (err) {
    console.error('Failed to open verifyit_ai.db:', err.message);
  }
}

function getSqlWhereClause(categories) {
  if (!categories || categories.length === 0) return { clause: '', params: [] };
  
  const clauses = [];
  const params = [];
  
  categories.forEach(cat => {
    const catLower = cat.toLowerCase();
    let keywords = [];
    if (catLower.includes('civics')) {
      keywords = ['Civics', 'Constitution', 'Amendment', 'Government'];
    } else if (catLower.includes('news') || catLower.includes('literacy')) {
      keywords = ['News', 'Literacy', 'Disinformation', 'Bias', 'Media', 'Fact'];
    } else if (catLower.includes('vote') || catLower.includes('voting')) {
      keywords = ['Vote', 'Voting', 'Voter', 'Election', 'Suppression'];
    }
    
    keywords.forEach(kw => {
      clauses.push('question_categories LIKE ?');
      params.push(`%${kw}%`);
    });
  });
  
  if (clauses.length === 0) return { clause: '', params: [] };
  return {
    clause: ` WHERE ${clauses.join(' OR ')}`,
    params
  };
}

function fetchQuestions(dbSelection, categories, count = 10) {
  const db = dbSelection === 'ai' ? dbAi : dbOriginal;
  
  if (!db) {
    console.log(`Database connection missing for ${dbSelection}. Using fallbacks.`);
    let filtered = FALLBACK_QUESTIONS;
    if (categories && categories.length > 0) {
      const requestedCats = categories.map(c => c.toLowerCase());
      filtered = FALLBACK_QUESTIONS.filter(q => {
        const cats = q.categories || [q.category];
        return cats.some(cat => requestedCats.includes(cat.toLowerCase()));
      });
    }
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
  }
  
  try {
    const { clause, params } = getSqlWhereClause(categories);
    const query = `SELECT question_id, title, question_categories, question_content, followup, choices, correct_choice, hints FROM question${clause} ORDER BY random()`;
    
    const rows = db.prepare(query).all(...params);
    
    const loaded = [];
    for (const row of rows) {
      const parsedChoices = parseChoices(row.choices);
      if (parsedChoices.length < 2 || row.correct_choice < 1 || row.correct_choice > parsedChoices.length) {
        continue;
      }
      
      const mappedCats = getMappedCategories(row.question_categories);
      const correctAnswerLetter = String.fromCharCode(97 + row.correct_choice - 1);
      const hintsArray = row.hints ? parseChoices(row.hints).map(h => h.text) : [];
      
      let text = decodeHtmlEntities(row.question_content);
      let explanation = row.followup ? decodeHtmlEntities(row.followup) : 'No explanation provided.';
      
      const isEmptyHtml = (str) => {
        if (!str) return true;
        const clean = str.replace(/<[^>]*>/g, '').replace(/\s/g, '');
        return clean === '';
      };
      
      if (isEmptyHtml(row.followup) && !isEmptyHtml(row.question_content)) {
        text = `<h3>${decodeHtmlEntities(row.title)}</h3>`;
        explanation = decodeHtmlEntities(row.question_content);
      }

      text = injectHints(cleanHtml(text), hintsArray);
      explanation = injectHints(cleanHtml(explanation), hintsArray);

      loaded.push({
        id: row.question_id,
        title: row.title,
        categories: mappedCats,
        text,
        type: parsedChoices.length === 2 ? 'boolean' : 'multiple-choice',
        options: parsedChoices,
        correctAnswer: correctAnswerLetter,
        explanation
      });
      
      if (loaded.length >= count) {
        break;
      }
    }
    
    // If we didn't find enough matching database questions, try fetching any questions as backup
    if (loaded.length < count && categories && categories.length > 0) {
      const backupQuery = `SELECT question_id, title, question_categories, question_content, followup, choices, correct_choice, hints FROM question ORDER BY random()`;
      const backupRows = db.prepare(backupQuery).all();
      for (const row of backupRows) {
        if (loaded.some(item => item.id === row.question_id)) continue;
        const parsedChoices = parseChoices(row.choices);
        if (parsedChoices.length < 2 || row.correct_choice < 1 || row.correct_choice > parsedChoices.length) continue;
        
        const mappedCats = getMappedCategories(row.question_categories);
        const correctAnswerLetter = String.fromCharCode(97 + row.correct_choice - 1);
        const hintsArray = row.hints ? parseChoices(row.hints).map(h => h.text) : [];
        
        let text = decodeHtmlEntities(row.question_content);
        let explanation = row.followup ? decodeHtmlEntities(row.followup) : 'No explanation provided.';
        
        const isEmptyHtml = (str) => {
          if (!str) return true;
          const clean = str.replace(/<[^>]*>/g, '').replace(/\s/g, '');
          return clean === '';
        };
        
        if (isEmptyHtml(row.followup) && !isEmptyHtml(row.question_content)) {
          text = `<h3>${decodeHtmlEntities(row.title)}</h3>`;
          explanation = decodeHtmlEntities(row.question_content);
        }

        text = injectHints(cleanHtml(text), hintsArray);
        explanation = injectHints(cleanHtml(explanation), hintsArray);

        loaded.push({
          id: row.question_id,
          title: row.title,
          categories: mappedCats,
          text,
          type: parsedChoices.length === 2 ? 'boolean' : 'multiple-choice',
          options: parsedChoices,
          correctAnswer: correctAnswerLetter,
          explanation
        });
        
        if (loaded.length >= count) break;
      }
    }
    
    return loaded;
  } catch (err) {
    console.error('SQLite query failed, falling back to in-memory questions:', err.message);
    let filtered = FALLBACK_QUESTIONS;
    if (categories && categories.length > 0) {
      const requestedCats = categories.map(c => c.toLowerCase());
      filtered = FALLBACK_QUESTIONS.filter(q => {
        const cats = q.categories || [q.category];
        return cats.some(cat => requestedCats.includes(cat.toLowerCase()));
      });
    }
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
  }
}

const DB_DOWNLOAD_URL = process.env.DB_DOWNLOAD_URL || '';
const DB_AI_DOWNLOAD_URL = process.env.DB_AI_DOWNLOAD_URL || '';

async function verifyDatabaseExists(dbFilename) {
  const localPath = path.resolve(__dirname, dbFilename);
  const parentPath = path.resolve(__dirname, '../', dbFilename);
  
  if (fs.existsSync(localPath) || fs.existsSync(parentPath)) {
    return;
  }
  
  const downloadUrl = dbFilename === 'verifyit.db' ? DB_DOWNLOAD_URL : DB_AI_DOWNLOAD_URL;
  
  if (downloadUrl) {
    console.log(`${dbFilename} is missing. Downloading from ${downloadUrl}...`);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Failed to fetch database: ${res.statusText}`);
      
      const fileStream = fs.createWriteStream(parentPath);
      await finished(Readable.fromWeb(res.body).pipe(fileStream));
      console.log(`${dbFilename} successfully downloaded to ${parentPath}`);
    } catch (err) {
      console.error(`Failed to download ${dbFilename} on startup:`, err.message);
    }
  }
}

// Express API endpoints
app.get('/api/questions', (req, res) => {
  const dbSelection = req.query.db || 'original';
  const categoriesParam = req.query.categories;
  const count = parseInt(req.query.count, 10) || 10;
  
  const categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim()) : [];
  const questions = fetchQuestions(dbSelection, categories, count);
  res.json(questions);
});

// Room Game Sessions
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Host creates room
  socket.on('room:create', ({ categories, db: dbSelection } = {}) => {
    const code = generateRoomCode();
    
    const gameQuestions = fetchQuestions(dbSelection, categories, 10);

    const room = {
      code,
      hostId: socket.id,
      players: [],
      state: 'lobby',
      currentQuestionIndex: -1,
      questions: gameQuestions,
      answersReceived: [],
      activeTimer: null,
      timeLeft: 0
    };
    rooms.set(code, room);
    socket.join(code);
    
    console.log(`Room created: ${code} by host ${socket.id} using database: ${dbSelection || 'original'} with ${gameQuestions.length} questions`);
    socket.emit('room:created', { roomCode: code });
  });

  // 2. Player joins room
  socket.on('player:join', ({ roomCode, name }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('player:joined', { status: 'error', message: 'Room not found' });
      return;
    }
    if (room.state !== 'lobby') {
      socket.emit('player:joined', { status: 'error', message: 'Game has already started' });
      return;
    }
    if (room.players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      socket.emit('player:joined', { status: 'error', message: 'Nickname is already taken' });
      return;
    }

    const newPlayer = {
      id: socket.id,
      name: name.trim(),
      score: 0,
      lastAnswerCorrect: false,
      pointsEarned: 0
    };
    room.players.push(newPlayer);
    socket.join(roomCode);

    console.log(`Player ${name} (${socket.id}) joined room ${roomCode}`);
    socket.emit('player:joined', { status: 'success', playerId: socket.id, roomCode });
    io.to(room.hostId).emit('lobby:update', { players: room.players });
  });

  // 3. Host starts game
  socket.on('game:start', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    console.log(`Starting game in room ${roomCode}`);
    sendQuestion(room, 0);
  });

  // 4. Player submits answer
  socket.on('player:submit', ({ roomCode, answerId, timeTakenMs }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== 'question') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (room.answersReceived.some(ans => ans.playerId === socket.id)) return;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    const isCorrect = currentQuestion.correctAnswer === answerId;

    const duration = 20000;
    const timeRatio = Math.min(1, timeTakenMs / duration);
    const speedBonus = Math.floor((1 - timeRatio) * 500);
    const points = isCorrect ? (500 + speedBonus) : 0;

    room.answersReceived.push({
      playerId: socket.id,
      optionId: answerId,
      timeTakenMs,
      isCorrect,
      points
    });

    console.log(`Submission from ${player.name} in room ${roomCode}: answer=${answerId}, correct=${isCorrect}, points=${points}`);
    
    io.to(room.hostId).emit('player:submitted', { 
      submittedCount: room.answersReceived.length,
      totalCount: room.players.length
    });

    if (room.answersReceived.length === room.players.length) {
      endQuestion(room);
    }
  });

  // 5. Host moves to next question
  socket.on('game:next', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.currentQuestionIndex + 1 < room.questions.length) {
      sendQuestion(room, room.currentQuestionIndex + 1);
    } else {
      room.state = 'podium';
      const standings = [...room.players].sort((a, b) => b.score - a.score);
      io.to(roomCode).emit('podium:show', { standings });
    }
  });

  // 6. Host triggers leaderboard show
  socket.on('leaderboard:show', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.state = 'leaderboard';
    const standings = [...room.players].sort((a, b) => b.score - a.score);
    io.to(roomCode).emit('leaderboard:update', { standings });
  });

  // 7. Disconnection
  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.hostId === socket.id) {
        console.log(`Host disconnected, closing room ${code}`);
        io.to(code).emit('room:closed', { reason: 'Host disconnected' });
        if (room.activeTimer) clearInterval(room.activeTimer);
        rooms.delete(code);
      } else {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const name = room.players[playerIndex].name;
          room.players.splice(playerIndex, 1);
          console.log(`Player ${name} left room ${code}`);
          io.to(room.hostId).emit('lobby:update', { players: room.players });

          if (room.state === 'question' && room.answersReceived.length === room.players.length) {
            endQuestion(room);
          }
        }
      }
    }
  });
});

function sendQuestion(room, index) {
  if (room.activeTimer) clearInterval(room.activeTimer);

  room.state = 'question';
  room.currentQuestionIndex = index;
  room.answersReceived = [];
  
  const questionData = room.questions[index];
  const clientQuestion = {
    id: questionData.id,
    category: questionData.categories.join(', '),
    text: questionData.text,
    type: questionData.type,
    options: questionData.options,
    index: index,
    total: room.questions.length
  };

  io.to(room.code).emit('question:load', { question: clientQuestion, duration: 20 });

  room.timeLeft = 20;
  room.activeTimer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('timer:tick', { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.activeTimer);
      endQuestion(room);
    }
  }, 1000);
}

function endQuestion(room) {
  if (room.activeTimer) clearInterval(room.activeTimer);
  room.state = 'reveal';

  const currentQuestion = room.questions[room.currentQuestionIndex];
  
  const stats = {};
  currentQuestion.options.forEach(opt => {
    stats[opt.id] = 0;
  });
  room.answersReceived.forEach(ans => {
    stats[ans.optionId] = (stats[ans.optionId] || 0) + 1;
  });

  room.players.forEach(p => {
    const submission = room.answersReceived.find(ans => ans.playerId === p.id);
    if (submission) {
      p.score += submission.points;
      p.pointsEarned = submission.points;
      p.lastAnswerCorrect = submission.isCorrect;
    } else {
      p.pointsEarned = 0;
      p.lastAnswerCorrect = false;
    }
  });

  room.players.forEach(p => {
    io.to(p.id).emit('question:result', {
      isCorrect: p.lastAnswerCorrect,
      pointsEarned: p.pointsEarned,
      totalScore: p.score,
      correctAnswerId: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation
    });
  });

  io.to(room.hostId).emit('question:result_host', {
    correctAnswerId: currentQuestion.correctAnswer,
    explanation: currentQuestion.explanation,
    stats,
    submittedCount: room.answersReceived.length,
    totalPlayers: room.players.length
  });
}

// Initialize server and load databases
async function startApp() {
  await verifyDatabaseExists('verifyit.db');
  await verifyDatabaseExists('verifyit_ai.db');
  initDatabaseConnections();
  
  server.listen(PORT, () => {
    console.log(`VerifyIt server running on port ${PORT}`);
  });
}

startApp();
