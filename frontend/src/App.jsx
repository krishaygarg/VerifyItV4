import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SAMPLE_QUESTIONS } from './data/questions';
import BrandLogo from './components/BrandLogo';
import { 
  Award, Users, Play, ArrowRight, RotateCcw, 
  HelpCircle, Trophy, Clock, BookOpen, Shield, 
  CheckCircle, XCircle, ChevronRight, User, AlertCircle, FileText
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function App() {
  // Navigation States: home, solo_setup, solo_game, solo_summary, host_setup, host_lobby, host_game, player_join, player_lobby, player_game
  const [mode, setMode] = useState('home');
  const [activeDb, setActiveDb] = useState('original'); // 'original' or 'ai'
  
  // Single Player States
  const [soloCategories, setSoloCategories] = useState(['Civics', 'News Literacy', 'Voting Rights']);
  const [soloQuestions, setSoloQuestions] = useState([]);
  const [soloCurrentIdx, setSoloCurrentIdx] = useState(0);
  const [soloSelectedAns, setSoloSelectedAns] = useState(null);
  const [soloAnswersRevealed, setSoloAnswersRevealed] = useState(false);
  const [soloScore, setSoloScore] = useState(0);
  
  // Real-time Socket.io Multiplayer States
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [multiError, setMultiError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Host Game States
  const [hostGameState, setHostGameState] = useState('lobby'); // lobby, question, reveal, leaderboard, podium
  const [hostCategories, setHostCategories] = useState(['Civics', 'News Literacy', 'Voting Rights']);
  const [hostQuestion, setHostQuestion] = useState(null);
  const [hostTimeLeft, setHostTimeLeft] = useState(0);
  const [hostSubmissions, setHostSubmissions] = useState({ submittedCount: 0, totalCount: 0 });
  const [hostStats, setHostStats] = useState(null);
  const [hostLeaderboard, setHostLeaderboard] = useState([]);
  const [hostCorrectAnsId, setHostCorrectAnsId] = useState('');
  const [hostExplanation, setHostExplanation] = useState('');
  
  // Player Game States
  const [playerGameState, setPlayerGameState] = useState('wait_question'); // wait_question, answering, locked, reveal, leaderboard, podium
  const [playerQuestion, setPlayerQuestion] = useState(null);
  const [playerTimeLeft, setPlayerTimeLeft] = useState(0);
  const [playerSelectedAns, setPlayerSelectedAns] = useState(null);
  const [playerResult, setPlayerResult] = useState(null); // { isCorrect, pointsEarned, totalScore, correctAnswerId, explanation }
  const [playerStandings, setPlayerStandings] = useState([]);

  // Timing helper
  const questionStartRef = useRef(null);

  // Initialize Socket.io Connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      autoConnect: false
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setHostGameState('lobby');
      setMode('host_lobby');
      setIsConnecting(false);
    });

    socket.on('player:joined', ({ status, message, playerId, roomCode }) => {
      setIsConnecting(false);
      if (status === 'success') {
        setRoomCode(roomCode);
        setMode('player_lobby');
      } else {
        setMultiError(message || 'Failed to join');
        socket.disconnect();
      }
    });

    socket.on('lobby:update', ({ players }) => {
      setLobbyPlayers(players);
    });

    socket.on('question:load', ({ question, duration }) => {
      // For Player
      setPlayerQuestion(question);
      setPlayerSelectedAns(null);
      setPlayerGameState('answering');
      setPlayerTimeLeft(duration);
      questionStartRef.current = performance.now();

      // For Host
      setHostQuestion(question);
      setHostTimeLeft(duration);
      setHostSubmissions({ submittedCount: 0, totalCount: lobbyPlayers.length });
      setHostGameState('question');
      setMode(prev => prev === 'host_lobby' || prev === 'host_game' ? 'host_game' : prev);
      setMode(prev => prev === 'player_lobby' || prev === 'player_game' ? 'player_game' : prev);
    });

    socket.on('timer:tick', ({ timeLeft }) => {
      setHostTimeLeft(timeLeft);
      setPlayerTimeLeft(timeLeft);
    });

    socket.on('player:submitted', ({ submittedCount, totalCount }) => {
      setHostSubmissions({ submittedCount, totalCount });
    });

    socket.on('question:result_host', ({ correctAnswerId, explanation, stats }) => {
      setHostCorrectAnsId(correctAnswerId);
      setHostExplanation(explanation);
      setHostStats(stats);
      setHostGameState('reveal');
    });

    socket.on('question:result', (result) => {
      setPlayerResult(result);
      setPlayerGameState('reveal');
    });

    socket.on('leaderboard:update', ({ standings }) => {
      setHostLeaderboard(standings);
      setHostGameState('leaderboard');
      
      // Update individual player standings
      setPlayerStandings(standings);
      setPlayerGameState('leaderboard');
    });

    socket.on('podium:show', ({ standings }) => {
      setHostLeaderboard(standings);
      setHostGameState('podium');

      setPlayerStandings(standings);
      setPlayerGameState('podium');
    });

    socket.on('room:closed', ({ reason }) => {
      alert(`Room closed: ${reason}`);
      handleExit();
    });

    return () => {
      socket.off('room:created');
      socket.off('player:joined');
      socket.off('lobby:update');
      socket.off('question:load');
      socket.off('timer:tick');
      socket.off('player:submitted');
      socket.off('question:result_host');
      socket.off('question:result');
      socket.off('leaderboard:update');
      socket.off('podium:show');
      socket.off('room:closed');
    };
  }, [socket, lobbyPlayers]);

  const handleExit = () => {
    if (socket) {
      socket.disconnect();
    }
    setMode('home');
    setRoomCode('');
    setNickname('');
    setLobbyPlayers([]);
    setMultiError('');
    setHostGameState('lobby');
    setPlayerGameState('wait_question');
  };

  // Solo Setup and Play Handlers
  const handleSoloSetup = () => {
    setMode('solo_setup');
  };

  const handleToggleSoloCategory = (cat) => {
    if (soloCategories.includes(cat)) {
      if (soloCategories.length > 1) {
        setSoloCategories(soloCategories.filter(c => c !== cat));
      }
    } else {
      setSoloCategories([...soloCategories, cat]);
    }
  };

  const handleStartSoloGame = () => {
    fetch(`${BACKEND_URL}/api/questions?categories=${soloCategories.join(',')}&count=10&db=${activeDb}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setSoloQuestions(data);
          setSoloCurrentIdx(0);
          setSoloSelectedAns(null);
          setSoloAnswersRevealed(false);
          setSoloScore(0);
          setMode('solo_game');
        } else {
          alert('No questions found for the selected categories.');
        }
      })
      .catch(err => {
        console.error('Failed to fetch questions from backend, using local fallbacks', err);
        const filtered = SAMPLE_QUESTIONS.filter(q => {
          const cats = q.categories || [q.category];
          return cats.some(cat => soloCategories.includes(cat));
        });
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setSoloQuestions(shuffled);
        setSoloCurrentIdx(0);
        setSoloSelectedAns(null);
        setSoloAnswersRevealed(false);
        setSoloScore(0);
        setMode('solo_game');
      });
  };

  const handleSoloAnswerSelect = (optionId) => {
    if (soloAnswersRevealed) return;
    setSoloSelectedAns(optionId);
    setSoloAnswersRevealed(true);
    const correct = soloQuestions[soloCurrentIdx].correctAnswer === optionId;
    if (correct) {
      setSoloScore(prev => prev + 1);
    }
  };

  const handleSoloNext = () => {
    if (soloCurrentIdx + 1 < soloQuestions.length) {
      setSoloCurrentIdx(prev => prev + 1);
      setSoloSelectedAns(null);
      setSoloAnswersRevealed(false);
    } else {
      setMode('solo_summary');
    }
  };

  const getRankBadge = (correct, total) => {
    const pct = correct / total;
    if (pct >= 0.9) return { name: 'Truth Sentinel', icon: Shield, desc: 'Absolute master of facts and civic integrity!' };
    if (pct >= 0.7) return { name: 'Editor-in-Chief', icon: Award, desc: 'Outstanding editorial judgment and verification skill.' };
    if (pct >= 0.4) return { name: 'Investigative Journalist', icon: BookOpen, desc: 'Sharp eyes for fact checking and analyzing details.' };
    return { name: 'Reporter Intern', icon: User, desc: 'Just starting to verify sources. Keep learning!' };
  };

  // Multi Host Handlers
  const handleHostSetup = () => {
    setMode('host_setup');
  };

  const handleToggleHostCategory = (cat) => {
    if (hostCategories.includes(cat)) {
      if (hostCategories.length > 1) {
        setHostCategories(hostCategories.filter(c => c !== cat));
      }
    } else {
      setHostCategories([...hostCategories, cat]);
    }
  };

  const handleCreateHostRoom = () => {
    setIsConnecting(true);
    socket.connect();
    socket.emit('room:create', { categories: hostCategories, db: activeDb });
  };

  const handleHostStartGame = () => {
    socket.emit('game:start', { roomCode });
  };

  const handleHostShowLeaderboard = () => {
    socket.emit('leaderboard:show', { roomCode });
  };

  const handleHostNextQuestion = () => {
    socket.emit('game:next', { roomCode });
  };

  // Multi Player Handlers
  const handlePlayerJoinSetup = () => {
    setMode('player_join');
    setMultiError('');
  };

  const handlePlayerJoinSubmit = (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) {
      setMultiError('Room Code and Nickname are required.');
      return;
    }
    setIsConnecting(true);
    setMultiError('');
    socket.connect();
    socket.emit('player:join', { roomCode: roomCode.trim(), name: nickname.trim() });
  };

  const handlePlayerSubmitAnswer = (optionId) => {
    if (playerGameState !== 'answering') return;
    setPlayerSelectedAns(optionId);
    setPlayerGameState('locked');
    const timeTakenMs = performance.now() - questionStartRef.current;
    socket.emit('player:submit', { roomCode, answerId: optionId, timeTakenMs });
  };

  const getPlayerRankName = (score) => {
    if (score >= 4000) return 'Truth Sentinel';
    if (score >= 2500) return 'Editor-in-Chief';
    if (score >= 1200) return 'Investigative Journalist';
    return 'Reporter Intern';
  };

  return (
    <div className="app-container">
      {/* Brand Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ cursor: 'pointer' }} onClick={handleExit}>
          <BrandLogo size="small" />
        </div>
        {mode !== 'home' && (
          <button className="btn btn-danger" onClick={handleExit}>
            Exit Game
          </button>
        )}
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* 1. HOME SCREEN */}
        {mode === 'home' && (
          <div className="animate-scale-up" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <BrandLogo size="large" />
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              The Premier Civics, Voting, News Literacy Game
            </h2>
            
            <div className="card" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield style={{ color: 'var(--color-gold)' }} /> Become an Active Citizen!
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                <li style={{ marginBottom: '8px' }}>Do you know enough civics to pass the U.S. Citizenship test?</li>
                <li style={{ marginBottom: '8px' }}>Do you know how to register/pre-register and vote in your state?</li>
                <li style={{ marginBottom: '8px' }}>Do you know how to spot disinformation online?</li>
              </ul>
            </div>

            <div className="card" style={{ maxWidth: '400px', margin: '0 auto 2rem', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Select Trivia Database
              </h4>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '30px' }}>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    padding: '8px 16px', 
                    fontSize: '0.9rem',
                    background: activeDb === 'original' ? 'var(--text-white)' : 'transparent',
                    color: activeDb === 'original' ? 'var(--bg-primary)' : 'var(--text-white)',
                    borderRadius: '25px',
                    boxShadow: activeDb === 'original' ? 'var(--shadow-sm)' : 'none'
                  }}
                  onClick={() => setActiveDb('original')}
                >
                  Original (1,700+ Qs)
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    padding: '8px 16px', 
                    fontSize: '0.9rem',
                    background: activeDb === 'ai' ? 'var(--text-white)' : 'transparent',
                    color: activeDb === 'ai' ? 'var(--bg-primary)' : 'var(--text-white)',
                    borderRadius: '25px',
                    boxShadow: activeDb === 'ai' ? 'var(--shadow-sm)' : 'none'
                  }}
                  onClick={() => setActiveDb('ai')}
                >
                  AI Modern (Verified)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '360px', margin: '0 auto' }}>
              <button className="btn btn-primary" onClick={handleSoloSetup}>
                <Play size={18} /> Player | Student (Solo)
              </button>
              <button className="btn" onClick={handleHostSetup} disabled={isConnecting}>
                <Users size={18} /> {isConnecting ? 'Setting up...' : 'Teacher | Host (Live)'}
              </button>
              <button className="btn btn-accent" onClick={handlePlayerJoinSetup}>
                Join Live Broadcast
              </button>
            </div>
          </div>
        )}

        {/* 2. SOLO SETUP SCREEN */}
        {mode === 'solo_setup' && (
          <div className="card animate-scale-up" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Select Categories</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
              {['Civics', 'News Literacy', 'Voting Rights'].map(cat => {
                const selected = soloCategories.includes(cat);
                return (
                  <div 
                    key={cat}
                    className={`option-card ${selected ? 'correct' : ''}`}
                    onClick={() => handleToggleSoloCategory(cat)}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span>{cat}</span>
                    <span className="option-badge">
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setMode('home')}>
                Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStartSoloGame}>
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* HOST SETUP SCREEN */}
        {mode === 'host_setup' && (
          <div className="card animate-scale-up" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Host Game: Select Categories</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
              {['Civics', 'News Literacy', 'Voting Rights'].map(cat => {
                const selected = hostCategories.includes(cat);
                return (
                  <div 
                    key={cat}
                    className={`option-card ${selected ? 'correct' : ''}`}
                    onClick={() => handleToggleHostCategory(cat)}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span>{cat}</span>
                    <span className="option-badge">
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setMode('home')}>
                Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateHostRoom} disabled={isConnecting}>
                {isConnecting ? 'Setting up Room...' : 'Create Live Lobby'}
              </button>
            </div>
          </div>
        )}

        {/* 3. SOLO GAME SCREEN */}
        {mode === 'solo_game' && soloQuestions.length > 0 && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="game-header">
              <span className="leaderboard-badge">{soloQuestions[soloCurrentIdx].category}</span>
              <span style={{ fontWeight: 600 }}>Question {soloCurrentIdx + 1} of {soloQuestions.length}</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>Score: {soloScore}</span>
            </div>

            <div className="card">
              <div className="question-text" dangerouslySetInnerHTML={{ __html: soloQuestions[soloCurrentIdx].text }} />
              
              <div className="options-grid">
                {soloQuestions[soloCurrentIdx].options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = soloSelectedAns === opt.id;
                  const isCorrect = opt.id === soloQuestions[soloCurrentIdx].correctAnswer;
                  
                  let cardClass = '';
                  if (soloAnswersRevealed) {
                    if (isCorrect) cardClass = 'correct';
                    else if (isSelected) cardClass = 'incorrect';
                  } else if (isSelected) {
                    cardClass = 'selected';
                  }

                  return (
                    <button
                      key={opt.id}
                      className={`option-card ${cardClass}`}
                      onClick={() => handleSoloAnswerSelect(opt.id)}
                      disabled={soloAnswersRevealed}
                    >
                      <span className="option-badge">{letter}</span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {soloAnswersRevealed && (
                <div className="explanation-panel animate-slide-in">
                  <div className="explanation-title">
                    <BookOpen size={16} /> Press Briefing Explanation
                  </div>
                  <div style={{ lineHeight: '1.5', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: soloQuestions[soloCurrentIdx].explanation }} />
                </div>
              )}

              {soloAnswersRevealed && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary animate-pulse" onClick={handleSoloNext}>
                    {soloCurrentIdx + 1 < soloQuestions.length ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SOLO SUMMARY SCREEN */}
        {mode === 'solo_summary' && (
          <div className="card animate-scale-up" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
            <Trophy size={60} style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Game Completed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your final fact check report summary</p>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '8px' }}>
                {soloScore} / {soloQuestions.length}
              </div>
              <p style={{ fontWeight: 600 }}>Correct Verdicts Filed</p>
            </div>

            {/* Rank badge display */}
            {(() => {
              const rank = getRankBadge(soloScore, soloQuestions.length);
              const RankIcon = rank.icon;
              return (
                <div style={{ border: '2px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'left' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%' }}>
                    <RankIcon size={32} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', color: '#ffffff' }}>{rank.name}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{rank.desc}</p>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleExit}>
                Home Menu
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStartSoloGame}>
                <RotateCcw size={16} /> Play Again
              </button>
            </div>
          </div>
        )}

        {/* 5. MULTIPLAYER JOIN SCREEN */}
        {mode === 'player_join' && (
          <div className="card animate-scale-up" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Join Live Game</h2>
            
            {multiError && (
              <div className="explanation-panel" style={{ borderLeftColor: 'var(--color-red)', background: 'rgba(255,59,59,0.1)', color: '#ff8a8a', padding: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {multiError}
              </div>
            )}

            <form onSubmit={handlePlayerJoinSubmit}>
              <div className="input-group">
                <label className="input-label">Room PIN</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter 4-digit PIN"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Journalist Nickname</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. TruthSeeker"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.substring(0, 15))}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-accent" 
                style={{ width: '100%', marginTop: '10px' }}
                disabled={isConnecting}
              >
                {isConnecting ? 'Filing Press Credentials...' : 'Register Press Pass'}
              </button>
            </form>
          </div>
        )}

        {/* 6. PLAYER LOBBY SCREEN */}
        {mode === 'player_lobby' && (
          <div className="card animate-scale-up" style={{ maxWidth: '450px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
            <div className="animate-pulse" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', background: 'rgba(0,200,83,0.1)', border: '3px solid var(--color-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <CheckCircle size={40} style={{ color: 'var(--color-green)' }} />
            </div>
            
            <h2 style={{ marginBottom: '8px' }}>Press Pass Confirmed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are connected to the newsroom.</p>
            
            <div style={{ border: '2px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '12px', background: 'rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>Room Code</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gold)', margin: '5px 0' }}>{roomCode}</div>
              <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />
              <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>Correspondent</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{nickname}</div>
            </div>

            <p className="animate-float" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Waiting for the Host to begin the live broadcast...
            </p>
          </div>
        )}

        {/* 7. PLAYER ACTIVE GAME SCREEN */}
        {mode === 'player_game' && (
          <div className="gamepad-container animate-fade-in" style={{ width: '100%' }}>
            
            {/* Wait Question State */}
            {playerGameState === 'wait_question' && (
              <div className="card text-center animate-scale-up" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
                <Clock size={48} className="animate-pulse" style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem' }} />
                <h3>Upcoming Broadcast</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Wait for the presenter to load the next slide...</p>
              </div>
            )}

            {/* Answering State */}
            {playerGameState === 'answering' && playerQuestion && (
              <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span className="leaderboard-badge">Lobby: {roomCode}</span>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={16} /> {playerTimeLeft}s
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>File Your Report</h3>
                <p style={{ color: 'var(--text-muted)' }}>Select the option that matches your check:</p>
                
                <div className="gamepad-grid">
                  {playerQuestion.options.map((opt, i) => {
                    const letters = ['a', 'b', 'c', 'd', 't', 'f'];
                    const letterIndex = playerQuestion.type === 'boolean' ? (opt.id === 't' ? 4 : 5) : i;
                    const letterLabel = String.fromCharCode(65 + i);
                    
                    const btnClasses = [
                      'btn-option-a', 'btn-option-b', 'btn-option-c', 'btn-option-d', 'btn-option-t', 'btn-option-f'
                    ];
                    
                    return (
                      <button
                        key={opt.id}
                        className={`gamepad-btn ${btnClasses[letterIndex]}`}
                        onClick={() => handlePlayerSubmitAnswer(opt.id)}
                      >
                        <span style={{ fontSize: '2rem' }}>{letterLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked / Answer Submitted State */}
            {playerGameState === 'locked' && (
              <div className="card animate-scale-up" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
                <CheckCircle size={48} className="animate-pulse" style={{ color: 'var(--color-green)', margin: '0 auto 1.5rem' }} />
                <h3>Report Filed!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Waiting for other correspondents to submit...</p>
              </div>
            )}

            {/* Reveal State */}
            {playerGameState === 'reveal' && playerResult && (
              <div className="card animate-scale-up" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                {playerResult.isCorrect ? (
                  <div style={{ color: 'var(--color-green)', marginBottom: '1.5rem' }}>
                    <CheckCircle size={60} style={{ margin: '0 auto 10px' }} />
                    <h2 style={{ fontSize: '2rem' }}>VERIFIED!</h2>
                    <div style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 600, marginTop: '8px' }}>
                      +{playerResult.pointsEarned} pts
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-red)', marginBottom: '1.5rem' }}>
                    <XCircle size={60} style={{ margin: '0 auto 10px' }} />
                    <h2 style={{ fontSize: '2rem' }}>DEBUNKED!</h2>
                    <div style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 600, marginTop: '8px' }}>
                      +0 pts
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginBottom: '5px' }}>Fact Briefing:</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: playerResult.explanation }} />
                </div>

                <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                  Your Total Score: <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.1rem' }}>{playerResult.totalScore}</span>
                </div>
              </div>
            )}

            {/* Leaderboard Intermission State */}
            {playerGameState === 'leaderboard' && (
              <div className="card animate-scale-up" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                <Users size={48} style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem' }} />
                <h3>Leaderboard Standings</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Look at the main projector screen!</p>
                
                {(() => {
                  const selfRankIdx = playerStandings.findIndex(p => p.id === socket.id);
                  if (selfRankIdx === -1) return null;
                  const rank = selfRankIdx + 1;
                  const score = playerStandings[selfRankIdx].score;
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Your Current Rank</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0' }}>#{rank}</div>
                      <p style={{ fontWeight: 600 }}>Score: {score} pts</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Podium State */}
            {playerGameState === 'podium' && (
              <div className="card animate-scale-up" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                <Trophy size={60} style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem' }} />
                <h2>Game Over!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>The final reports have been compiled.</p>
                
                {(() => {
                  const selfRankIdx = playerStandings.findIndex(p => p.id === socket.id);
                  if (selfRankIdx === -1) return null;
                  const rank = selfRankIdx + 1;
                  const score = playerStandings[selfRankIdx].score;
                  const badge = getPlayerRankName(score);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Final Rank</div>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-gold)', margin: '5px 0' }}>#{rank}</div>
                        <p style={{ fontWeight: 600 }}>Total Score: {score} pts</p>
                      </div>

                      <div style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                        <Shield size={24} style={{ color: 'var(--color-gold)' }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Earned Credentials:</div>
                          <div style={{ fontWeight: 700 }}>{badge}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        )}

        {/* 8. HOST LOBBY SCREEN */}
        {mode === 'host_lobby' && (
          <div className="card animate-scale-up" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Live Broadcasting Desk</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Players: Project this screen to the audience.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '16px', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>Join Code PIN</div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '2px' }}>{roomCode}</div>
              </div>
              
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>Registered Press</div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff' }}>{lobbyPlayers.length}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Correspondents in Lobby
              </h3>
              {lobbyPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}>
                  Waiting for journalists to join...
                </p>
              ) : (
                <div className="lobby-grid">
                  {lobbyPlayers.map(p => (
                    <div key={p.id} className="lobby-player-card animate-slide-in">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={handleHostStartGame}
              disabled={lobbyPlayers.length === 0}
            >
              Start Broadcast <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* 9. HOST ACTIVE GAME SCREEN */}
        {mode === 'host_game' && hostQuestion && (
          <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            
            {/* Host Question Phase */}
            {hostGameState === 'question' && (
              <div>
                <div className="game-header">
                  <span className="leaderboard-badge">Fact-Checking Room: {roomCode}</span>
                  <span style={{ fontWeight: 600 }}>Story {hostQuestion.index + 1} of {hostQuestion.total}</span>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    Reports Filed: {hostSubmissions.submittedCount} / {hostSubmissions.totalCount}
                  </span>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div className="question-text" style={{ textAlign: 'left', flex: 1, marginRight: '30px' }} dangerouslySetInnerHTML={{ __html: hostQuestion.text }} />
                    
                    {/* Timer component */}
                    <div className="timer-container">
                      <svg className="timer-svg">
                        <circle className="timer-circle-bg" cx="35" cy="35" r="30" />
                        <circle 
                          className={`timer-circle-val ${hostTimeLeft <= 5 ? 'timer-warning' : ''}`} 
                          cx="35" 
                          cy="35" 
                          r="30" 
                          strokeDasharray="188.4"
                          strokeDashoffset={188.4 - (hostTimeLeft / 20) * 188.4}
                        />
                      </svg>
                      <span className="timer-text">{hostTimeLeft}</span>
                    </div>
                  </div>

                  <div className="options-grid">
                    {hostQuestion.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return (
                        <div key={opt.id} className="option-card locked">
                          <span className="option-badge">{letter}</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Host Reveal Phase */}
            {hostGameState === 'reveal' && (
              <div>
                <div className="game-header">
                  <span className="leaderboard-badge">Fact Check Verdict</span>
                  <span style={{ fontWeight: 600 }}>Story {hostQuestion.index + 1} of {hostQuestion.total}</span>
                  <button className="btn btn-accent" onClick={handleHostShowLeaderboard}>
                    Show Standings <ChevronRight size={16} />
                  </button>
                </div>

                <div className="card">
                  <div className="question-text" style={{ fontSize: '1.6rem', textAlign: 'left', marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: hostQuestion.text }} />

                  <div className="options-grid" style={{ marginBottom: '2rem' }}>
                    {hostQuestion.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isCorrect = opt.id === hostCorrectAnsId;
                      return (
                        <div key={opt.id} className={`option-card locked ${isCorrect ? 'correct' : ''}`}>
                          <span className="option-badge">{letter}</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="explanation-panel animate-slide-in" style={{ marginBottom: '2rem' }}>
                    <h4 className="explanation-title">
                      <BookOpen size={16} /> Press Briefing Context
                    </h4>
                    <div style={{ lineHeight: '1.5', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: hostExplanation }} />
                  </div>

                  {/* Submission distribution stats bar chart */}
                  {hostStats && (
                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ marginBottom: '15px' }}>Response Distribution</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hostQuestion.options.map((opt, i) => {
                          const letter = String.fromCharCode(65 + i);
                          const count = hostStats[opt.id] || 0;
                          const percentage = hostSubmissions.totalCount > 0 ? (count / hostSubmissions.totalCount) * 100 : 0;
                          const isCorrect = opt.id === hostCorrectAnsId;
                          
                          return (
                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 700, width: '20px' }}>{letter}</span>
                              <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                <div 
                                  style={{ 
                                    width: `${percentage}%`, 
                                    height: '100%', 
                                    background: isCorrect ? 'var(--color-green)' : 'rgba(255,255,255,0.2)', 
                                    transition: 'width 0.8s ease-out' 
                                  }} 
                                />
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', fontWeight: 600 }}>
                                  {count} report{count !== 1 ? 's' : ''} ({Math.round(percentage)}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Host Leaderboard Phase */}
            {hostGameState === 'leaderboard' && (
              <div>
                <div className="game-header">
                  <span className="leaderboard-badge">Press Rankings</span>
                  <span style={{ fontWeight: 600 }}>Standings Overview</span>
                  <button className="btn btn-primary" onClick={handleHostNextQuestion}>
                    {hostQuestion.index + 1 < hostQuestion.total ? 'Next Story' : 'Final Report'} <ChevronRight size={16} />
                  </button>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy style={{ color: 'var(--color-gold)' }} /> Top Fact-Checkers
                  </h3>

                  <div className="leaderboard-list">
                    {hostLeaderboard.slice(0, 5).map((player, index) => {
                      const rank = index + 1;
                      const isTop = rank === 1;
                      const badgeName = getPlayerRankName(player.score);
                      
                      return (
                        <div key={player.id} className={`leaderboard-row ${isTop ? 'leaderboard-top-1 animate-pulse' : ''} animate-slide-in`}>
                          <span className="leaderboard-rank">#{rank}</span>
                          <div className="leaderboard-player">
                            <span className="leaderboard-name">{player.name}</span>
                            <span className="leaderboard-badge">{badgeName}</span>
                          </div>
                          
                          {player.pointsEarned > 0 && (
                            <span style={{ color: 'var(--color-green)', fontSize: '0.85rem', fontWeight: 600, marginRight: '15px' }}>
                              +{player.pointsEarned}
                            </span>
                          )}
                          <span className="leaderboard-score">{player.score} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Host Podium Screen */}
            {hostGameState === 'podium' && (
              <div className="card animate-scale-up" style={{ textAlign: 'center', padding: '40px' }}>
                <Trophy size={64} style={{ color: 'var(--color-gold)', margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Live Broadcast Concluded</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Final Results and Credentials Awarded</p>

                {/* 3D-style Podium Stand */}
                <div className="podium-container">
                  {/* First Place */}
                  {hostLeaderboard[0] && (
                    <div className="podium-step podium-place-1">
                      <span className="podium-crown">👑</span>
                      <span className="podium-name">{hostLeaderboard[0].name}</span>
                      <span className="podium-score">{hostLeaderboard[0].score} pts</span>
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '10px' }}>#1 Gold</div>
                    </div>
                  )}

                  {/* Second Place */}
                  {hostLeaderboard[1] && (
                    <div className="podium-step podium-place-2">
                      <span className="podium-name">{hostLeaderboard[1].name}</span>
                      <span className="podium-score">{hostLeaderboard[1].score} pts</span>
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '10px' }}>#2 Silver</div>
                    </div>
                  )}

                  {/* Third Place */}
                  {hostLeaderboard[2] && (
                    <div className="podium-step podium-place-3">
                      <span className="podium-name">{hostLeaderboard[2].name}</span>
                      <span className="podium-score">{hostLeaderboard[2].score} pts</span>
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '10px' }}>#3 Bronze</div>
                    </div>
                  )}
                </div>

                <div style={{ maxWidth: '400px', margin: '2rem auto 0' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExit}>
                    End Session
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
