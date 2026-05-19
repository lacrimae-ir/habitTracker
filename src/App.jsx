import { useState, useEffect, useRef } from 'react'
import plusHabitIcon from './assets/plushabit.png'
import xButtonIcon from './assets/xbutton.png'
import habitIcon from './assets/habit.png'
import './App.css'

// Programmatic Web Audio Synthesizer for Retro 8-Bit SFX
const playRetroSFX = (type, enabled) => {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'beep') {
      // Cute high retro select beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'coin') {
      // Classic Mario Coin sound (B5 followed immediately by E6)
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle'; // Softer, retro sound
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(987.77, 0, 0.08);    // B5
      playTone(1318.51, 0.08, 0.22); // E6
    } else if (type === 'delete') {
      // Slurring down sound effect
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'fanfare') {
      // Short victory arcade fanfare
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(523.25, 0, 0.08);   // C5
      playTone(659.25, 0.08, 0.08); // E5
      playTone(783.99, 0.16, 0.08); // G5
      playTone(1046.50, 0.24, 0.18); // C6
    }
  } catch (error) {
    console.warn("Sound blocked or not supported: ", error);
  }
};

function App() {
  // --- Initial state is empty — users start fresh on new install ---
  const initialHabits = [];

  // --- States ---
  const [habits, setHabits] = useState(() => {
    const local = localStorage.getItem('pixel_habits');
    return local ? JSON.parse(local) : initialHabits;
  });
  
  const [activeTab, setActiveTab] = useState('habits');
  const [inputVal, setInputVal] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showExitScreen, setShowExitScreen] = useState(false);

  const dropdownRef = useRef(null);

  // --- Save to Local Storage ---
  useEffect(() => {
    localStorage.setItem('pixel_habits', JSON.stringify(habits));
  }, [habits]);

  // --- Click Outside to Close Custom Dropdown ---
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --- Sound helper ---
  const triggerSFX = (type) => {
    playRetroSFX(type, soundEnabled);
  };

  // --- Actions ---
  const handleAddHabit = (e) => {
    if (e) e.preventDefault();
    const nameTrimmed = inputVal.trim().toUpperCase();
    if (!nameTrimmed) return;

    // Limit habit name to 24 chars to fit layout perfectly
    if (nameTrimmed.length > 24) {
      alert("PLEASE KEEP TARGET NAME UNDER 24 CHARACTERS!");
      return;
    }

    const newHabit = {
      id: Date.now().toString(),
      name: nameTrimmed,
      type: 'daily',
      completed: false,
      streak: 0,
      history: []
    };

    setHabits(prev => [newHabit, ...prev]);
    setInputVal('');
    triggerSFX('fanfare');
  };

  const handleToggleComplete = (id) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const nextCompleted = !habit.completed;
        let nextStreak = habit.streak;
        let nextHistory = [...habit.history];
        const todayStr = new Date().toISOString().split('T')[0];

        if (nextCompleted) {
          // If not completed already today, increase streak and add to history
          if (!nextHistory.includes(todayStr)) {
            nextHistory.push(todayStr);
            nextStreak += 1;
          }
          triggerSFX('coin');
        } else {
          // Decrement streak if unchecking today's complete
          if (nextHistory.includes(todayStr)) {
            nextHistory = nextHistory.filter(d => d !== todayStr);
            nextStreak = Math.max(0, nextStreak - 1);
          }
          triggerSFX('delete');
        }

        return {
          ...habit,
          completed: nextCompleted,
          streak: nextStreak,
          history: nextHistory
        };
      }
      return habit;
    }));
  };

  const handleChangeType = (id, newType) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        triggerSFX('beep');
        return { ...habit, type: newType };
      }
      return habit;
    }));
    setOpenDropdownId(null);
  };

  const handleDeleteHabit = (id) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
    triggerSFX('delete');
  };

  const handleReboot = () => {
    setHabits(initialHabits);
    setInputVal('');
    setActiveTab('habits');
    setOpenDropdownId(null);
    setShowExitModal(false);
    setShowExitScreen(false);
    triggerSFX('fanfare');
  };

  // --- Calculation Metrics for Dashboard ---
  const totalCount = habits.length;
  const completedTodayCount = habits.filter(h => h.completed).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;
  
  // Calculate average streak or highest streak
  const highestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  
  // Custom hearts rating based on highest streak (capped at 5 hearts)
  const heartsCount = Math.min(5, Math.max(1, Math.ceil(highestStreak / 3)));

  // Generate last 7 days metrics for contribution map
  const getLast7Days = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayLabel = weekdays[d.getDay()];
      
      // Calculate completeness rate for that date
      let doneCount = 0;
      let totalOnDay = habits.length;
      
      habits.forEach(h => {
        if (h.history.includes(dateString)) {
          doneCount++;
        }
      });

      let status = 'empty'; // empty, partial, filled
      if (totalOnDay > 0) {
        const ratio = doneCount / totalOnDay;
        if (ratio === 1) status = 'filled';
        else if (ratio > 0) status = 'partial';
      }

      days.push({
        date: dateString,
        label: dayLabel,
        status,
        done: doneCount,
        total: totalOnDay
      });
    }
    return days;
  };

  const recentDays = getLast7Days();

  return (
    <div className="desktop-window" ref={dropdownRef}>
      {/* exit goodbye splash overlay */}
      {showExitScreen && (
        <div className="goodbye-overlay">
          <h2 className="goodbye-title">SYSTEM SHUTDOWN</h2>
          <p className="goodbye-subtitle">ALL HABIT DATA PERSISTED. STAY HEALTHY!</p>
          <button className="reboot-btn" onClick={handleReboot}>
            REBOOT SYSTEM
          </button>
        </div>
      )}

      {/* window header matching screenshot style */}
      <header className="window-header">
        <div className="window-title-area">
          <img src={habitIcon} alt="Habit Tracker Icon" className="window-logo" />
          <h1 className="window-title">HABITS APP</h1>
        </div>
        <div className="window-controls">
          {/* SFX Mute/Unmute toggle */}
          <button 
            className="sfx-toggle" 
            title="Toggle retro audio"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                // Beep after state change (using new state directly)
                playRetroSFX('beep', true);
              }
            }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          {/* X close button — triggers Electron window close */}
          <button 
            className="exit-button" 
            onClick={() => {
              triggerSFX('beep');
              // If running inside Electron, close the window via IPC
              if (window.electronAPI) {
                setTimeout(() => window.electronAPI.closeApp(), 120);
              } else {
                setShowExitModal(true);
              }
            }}
          >
            <img src={xButtonIcon} alt="Exit App" />
          </button>
        </div>
      </header>

      {/* active view tabs: Habits / Analysis */}
      <nav className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => {
            triggerSFX('beep');
            setActiveTab('habits');
          }}
        >
          Habits
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => {
            triggerSFX('beep');
            setActiveTab('analysis');
          }}
        >
          Analysis
        </button>
      </nav>

      {/* main view wrapper */}
      <main className="window-content">
        {activeTab === 'habits' ? (
          <>
            {/* oval inputs & plus button form */}
            <form className="add-habit-form" onSubmit={handleAddHabit}>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="habit-input"
                  placeholder="ADD A NEW TARGET..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              </div>
              <button type="submit" className="add-button">
                <img src={plusHabitIcon} alt="Add Habit" />
              </button>
            </form>

            {/* habits list rows */}
            <div className="habits-list">
              {habits.length === 0 ? (
                <div className="empty-state">
                  <img src={habitIcon} alt="Empty" className="empty-state-img" />
                  <p className="empty-state-text">
                    NO HABITS TARGET YET!<br />
                    TYPE ABOVE AND CLICK [+] TO BEGIN.
                  </p>
                </div>
              ) : (
                habits.map(habit => (
                  <div 
                    key={habit.id} 
                    className={`habit-item ${habit.completed ? 'completed' : ''} ${openDropdownId === habit.id ? 'dropdown-active' : ''}`}
                  >
                    
                    {/* name & statistics */}
                    <div className="habit-info">
                      <p className="habit-name">{habit.name}</p>
                      <div className="habit-streak">
                        STREAK: {habit.streak} {habit.streak === 1 ? 'DAY' : 'DAYS'}
                      </div>
                    </div>

                    {/* actions: Custom Dropdown & Checkcircle */}
                    <div className="habit-actions">
                      <div className="dropdown-container">
                        <button 
                          className={`dropdown-trigger ${openDropdownId === habit.id ? 'open' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSFX('beep');
                            setOpenDropdownId(openDropdownId === habit.id ? null : habit.id);
                          }}
                        >
                          {habit.type} <span>∨</span>
                        </button>
                        
                        {/* custom selective dropdown menu */}
                        {openDropdownId === habit.id && (
                          <div className="dropdown-menu">
                            <button 
                              className={`dropdown-item ${habit.type === 'daily' ? 'selected' : ''}`}
                              onClick={() => handleChangeType(habit.id, 'daily')}
                            >
                              DAILY
                            </button>
                            <button 
                              className={`dropdown-item ${habit.type === 'weekly' ? 'selected' : ''}`}
                              onClick={() => handleChangeType(habit.id, 'weekly')}
                            >
                              WEEKLY
                            </button>
                          </div>
                        )}
                      </div>

                      {/* circular check circle bubble */}
                      <button 
                        className={`checkbox-button ${habit.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleComplete(habit.id)}
                      >
                        {habit.completed && (
                          <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      {/* delete habit button */}
                      <button 
                        className="delete-habit-btn" 
                        title="Delete target"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSFX('beep');
                          setDeleteConfirmId(habit.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Analysis Dashboard Sub-Panel */
          <div className="analysis-dashboard">
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">TOTAL HABITS</span>
                <span className="stat-value">{totalCount}</span>
                <span className="stat-sub">ACTIVE TARGETS</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">POWER STREAK</span>
                <span className="stat-value">{highestStreak}</span>
                <div className="hearts-row">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`heart-icon ${i >= heartsCount ? 'empty' : ''}`} 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Retro progress bar fill */}
            <div className="completion-card">
              <div className="progress-header">
                <span className="progress-title">DAILY COMPLETION</span>
                <span className="progress-percent">{completionPercentage}%</span>
              </div>
              <div className="pixel-progress-container">
                <div 
                  className="pixel-progress-fill" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* 7-Day retro tracker contribution map */}
            <div className="tracker-card">
              <h3 className="tracker-title">7-DAY ACTIVITY HISTORY</h3>
              <div className="grid-days">
                {recentDays.map((day, idx) => (
                  <div key={idx} className="grid-day-col">
                    <span className="grid-day-label">{day.label}</span>
                    <div 
                      className={`grid-day-box ${day.status}`}
                      data-tip={`${day.date}: ${day.done}/${day.total}`}
                      title={`${day.date}: ${day.done}/${day.total} habits completed`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Exit dialog modal pop-up */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">SHUTDOWN SYSTEM?</h3>
            <p className="modal-desc">ARE YOU SURE YOU WANT TO CLOSE PIXEL HABITS TIMER? ALL PROGRESS IS PERSISTED LOCALLY.</p>
            <div className="modal-actions">
              <button 
                className="modal-btn primary"
                onClick={() => {
                  triggerSFX('delete');
                  setShowExitModal(false);
                  setShowExitScreen(true);
                }}
              >
                YES, EXIT
              </button>
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  triggerSFX('beep');
                  setShowExitModal(false);
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Target pixel popup */}
      {deleteConfirmId && (() => {
        const target = habits.find(h => h.id === deleteConfirmId);
        return (
          <div className="modal-overlay delete-overlay" onClick={() => { triggerSFX('beep'); setDeleteConfirmId(null); }}>
            <div className="modal-content delete-modal-content" onClick={e => e.stopPropagation()}>
              {/* pixel corner decorations */}
              <div className="pixel-corner tl" />
              <div className="pixel-corner tr" />
              <div className="pixel-corner bl" />
              <div className="pixel-corner br" />

              <h3 className="modal-title delete-modal-title">HAPUS TARGET?</h3>
              <p className="delete-modal-name">&ldquo;{target?.name}&rdquo;</p>
              <p className="modal-desc delete-modal-desc">TARGET INI AKAN DIHAPUS PERMANEN. YAKIN?</p>
              <div className="modal-actions">
                <button 
                  className="modal-btn delete-confirm-btn"
                  onClick={() => {
                    handleDeleteHabit(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
                  YA, HAPUS
                </button>
                <button 
                  className="modal-btn delete-cancel-btn"
                  onClick={() => {
                    triggerSFX('beep');
                    setDeleteConfirmId(null);
                  }}
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
