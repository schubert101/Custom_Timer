import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Typography, TextField, Button, Box, IconButton, Paper, Drawer } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

interface SetConfig {
  work: number;
  rest: number;
}

const App: React.FC = () => {
  const [routineName, setRoutineName] = useState('');
  const [sets, setSets] = useState<SetConfig[]>([
    { work: 0, rest: 0 },
  ]);
  const [repeat, setRepeat] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [timeLeft, setTimeLeft] = useState(sets[0].work);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<number | null>(null);
  // Add beep sound for phase transitions
  const beepAudio = React.useRef<HTMLAudioElement | null>(null);

  // Routine save/load state
  const [savedRoutines, setSavedRoutines] = useState<{ name: string; sets: SetConfig[]; repeat: number }[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState('');

  useEffect(() => {
    setCurrentSetIndex(0);
    setCurrentRepeat(1);
    setPhase('work');
    setTimeLeft(sets[0].work);
  }, [sets, repeat]);

  // Load routines from localStorage on mount
  useEffect(() => {
    const routines = localStorage.getItem('routines');
    if (routines) {
      setSavedRoutines(JSON.parse(routines));
    }
  }, []);

  // Save current routine
  const saveRoutine = () => {
    if (!routineName.trim()) {
      alert('Please enter a routine name!');
      return;
    }
    const newRoutine = { name: routineName.trim(), sets, repeat };
    let updatedRoutines = savedRoutines.filter(r => r.name !== newRoutine.name);
    updatedRoutines.push(newRoutine);
    setSavedRoutines(updatedRoutines);
    localStorage.setItem('routines', JSON.stringify(updatedRoutines));
    alert('Routine saved!');
  };

  // Load selected routine
  const handleRoutineSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedRoutine(name);
    const routine = savedRoutines.find(r => r.name === name);
    if (routine) {
      setRoutineName(routine.name);
      setSets(routine.sets);
      setRepeat(routine.repeat);
    }
  };

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          if (phase === 'work') {
            if (sets[currentSetIndex].rest > 0) {
              setPhase('rest');
              setShake(true); // Trigger shake when work ends
              if (beepAudio.current) beepAudio.current.play();
              return sets[currentSetIndex].rest;
            } else {
              if (currentSetIndex < sets.length - 1) {
                setCurrentSetIndex(idx => idx + 1);
                setPhase('work');
                setShake(true); // Trigger shake when set changes
                if (beepAudio.current) beepAudio.current.play();
                return sets[currentSetIndex + 1].work;
              } else {
                if (currentRepeat < repeat) {
                  setCurrentRepeat(r => r + 1);
                  setCurrentSetIndex(0);
                  setPhase('work');
                  setShake(true); // Trigger shake when repeat changes
                  if (beepAudio.current) beepAudio.current.play();
                  return sets[0].work;
                } else {
                  setIsRunning(false);
                  setPhase('work');
                  setCurrentSetIndex(0);
                  setCurrentRepeat(1);
                  setShake(true); // Trigger shake when all done
                  if (beepAudio.current) beepAudio.current.play();
                  return sets[0].work;
                }
              }
            }
          } else {
            if (currentSetIndex < sets.length - 1) {
              setCurrentSetIndex(idx => idx + 1);
              setPhase('work');
              setShake(true); // Trigger shake when rest ends
              if (beepAudio.current) beepAudio.current.play();
              return sets[currentSetIndex + 1].work;
            } else {
              if (currentRepeat < repeat) {
                setCurrentRepeat(r => r + 1);
                setCurrentSetIndex(0);
                setPhase('work');
                setShake(true); // Trigger shake when repeat changes
                if (beepAudio.current) beepAudio.current.play();
                return sets[0].work;
              } else {
                setIsRunning(false);
                setPhase('work');
                setCurrentSetIndex(0);
                setCurrentRepeat(1);
                setShake(true); // Trigger shake when all done
                if (beepAudio.current) beepAudio.current.play();
                return sets[0].work;
              }
            }
          }
        }
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, phase, currentSetIndex, currentRepeat, sets, repeat]);

  // Remove shake class after animation
  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  const handleSetChange = (index: number, field: 'work' | 'rest', value: number) => {
    const newSets = sets.map((set, i) =>
      i === index ? { ...set, [field]: value } : set
    );
    setSets(newSets);
  };

  const handleAddSet = () => {
    setSets([...sets, { work: 0, rest: 0 }]);
  };

  const handleDeleteSet = (index: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentSetIndex(0);
    setCurrentRepeat(1);
    setPhase('work');
    setTimeLeft(sets[0].work);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: '#FDEAA6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Options Tab only visible when Drawer is closed */}
      {!drawerOpen && (
        <Box sx={{ position: 'fixed', top: '50%', left: 0, zIndex: 1301, transform: 'translateY(-50%)' }}>
          <Button
            onClick={() => setDrawerOpen(true)}
            sx={{
              borderRadius: '0 12px 12px 0',
              background: '#fff',
              color: '#222',
              fontWeight: 500,
              px: 0,
              py: 0,
              minWidth: 0,
              width: 32,
              height: 90,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: '0.65rem',
              letterSpacing: '0.03em',
              pointerEvents: 'auto',
              zIndex: 1400,
              '&:hover': { background: '#FFF9E3' },
            }}
          >
            Options
          </Button>
        </Box>
      )}
      {/* Drawer for Routine Config */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: 400 },
            maxWidth: 480,
            borderRadius: 0,
            background: '#fff',
            p: { xs: 2, md: 4 },
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
            overflow: 'visible',
          }
        }}
      >
        {/* X Close Button at top right for mobile */}
        <IconButton
          aria-label="close options panel"
          onClick={() => setDrawerOpen(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1500,
            color: '#FFC663',
            background: '#fff',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
            '&:hover': { background: '#FFF9E3' },
            display: { xs: 'flex', sm: 'flex' }
          }}
        >
          <CloseIcon />
        </IconButton>
        {/* Options Tab inside Drawer, always visible */}
        <Button
          onClick={() => setDrawerOpen(false)}
          sx={{
            position: 'absolute',
            left: -32,
            top: '50%',
            transform: 'translateY(-50%)',
            borderRadius: '0 12px 12px 0',
            background: '#fff',
            color: '#222',
            fontWeight: 500,
            px: 0,
            py: 0,
            minWidth: 0,
            width: 32,
            height: 90,
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '0.65rem',
            letterSpacing: '0.03em',
            pointerEvents: 'auto',
            zIndex: 1400,
            '&:hover': { background: '#FFF9E3' },
          }}
        >
          Options
        </Button>
        <Box sx={{ width: '100%' }}>
          <Box className="routine-name-box" sx={{ width: '100%', mb: 0.7 }}>
            <TextField
              label="Routine Name"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              fullWidth
              sx={{
                mb: 2,
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  borderColor: '#FFC663',
                  backgroundColor: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: '#FFC663',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFC663',
                },
              }}
              InputLabelProps={{ style: { color: '#FFC663' } }}
            />
          </Box>
          <Box className="sets-box" sx={{ width: '100%', mb: 0 }}>
            {sets.map((set, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 3, columnGap: 2 }}>
                <TextField
                  label="Work (secs)"
                  type="number"
                  value={set.work === 0 ? "" : set.work}
                  onChange={e => handleSetChange(idx, 'work', Number(e.target.value))}
                  fullWidth
                  id={`work-input-${idx}`}
                  sx={{
                    mr: 1,
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      borderColor: '#FFC663',
                      backgroundColor: '#fff',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#FFC663',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFC663',
                    },
                  }}
                  InputLabelProps={{ style: { color: '#FFC663' }, shrink: true }}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Rest (secs)"
                  type="number"
                  value={set.rest === 0 ? "" : set.rest}
                  onChange={e => handleSetChange(idx, 'rest', Number(e.target.value))}
                  fullWidth
                  id={`rest-input-${idx}`}
                  sx={{
                    ml: 1,
                    mr: 1,
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      borderColor: '#FFC663',
                      backgroundColor: '#fff',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#FFC663',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFC663',
                    },
                  }}
                  InputLabelProps={{ style: { color: '#FFC663' }, shrink: true }}
                  inputProps={{ min: 0 }}
                />
                <IconButton onClick={() => handleDeleteSet(idx)} disabled={sets.length === 1} sx={{ ml: 1 }}>
                  <DeleteIcon sx={{ color: '#FFB84C' }} />
                </IconButton>
              </Box>
            ))}
            <Button
              onClick={handleAddSet}
              sx={{
                color: '#FFB84C',
                fontWeight: 600,
                background: 'none',
                boxShadow: 'none',
                mt: 0,
                mb: 0,
                fontSize: '1.1rem',
                marginBottom: 0,
                '&:hover': { color: '#FFA500', background: 'none' }
              }}
            >
              + Add Set
            </Button>
          </Box>
          <Box className="repeat-box" sx={{ width: '100%', mb: 0.7, mt: 0 }}>
            <TextField
              label="Repeat Count"
              type="number"
              value={repeat}
              onChange={e => setRepeat(Number(e.target.value))}
              fullWidth
              sx={{
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  borderColor: '#FFC663',
                  backgroundColor: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: '#FFC663',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFC663',
                },
                mt: 0,
                marginTop: 0,
              }}
              InputLabelProps={{ style: { color: '#FFC663' } }}
              inputProps={{ min: 1 }}
            />
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Button variant="outlined" onClick={saveRoutine} sx={{ background: '#fff', borderColor: '#FFC663', color: '#FFC663', fontWeight: 600, borderRadius: 2, '&:hover': { borderColor: '#FFB84C', color: '#FFB84C', background: '#fff' } }}>
              Save Routine
            </Button>
          </Box>
        </Box>
      </Drawer>
      {/* Centered Timer Card */}
      <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1200 }}>
        <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', p: { xs: 2, md: 4 }, borderRadius: '30px', background: '#fff', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)', maxWidth: 600, width: { xs: '95vw', sm: 500 } }}>
          {/* Select Routine Dropdown */}
          <Box sx={{ width: '100%', mb: 2.5, display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
            <select
              value={selectedRoutine}
              onChange={handleRoutineSelect}
              style={{
                minWidth: 160,
                height: '40px',
                borderRadius: '12px',
                border: '1px solid #FFC663',
                padding: '0 32px 0 16px',
                color: '#FFC663',
                background: '#fff',
                fontWeight: 600,
                fontSize: '1.1rem',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                outline: 'none',
                boxShadow: 'none',
                backgroundImage:
                  'url("data:image/svg+xml;utf8,<svg fill=\'%23FFC663\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px 20px',
                cursor: 'pointer',
              }}
            >
              <option value="">SELECT ROUTINE</option>
              {savedRoutines.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </Box>
          {/* Timer Display */}
          <Box sx={{ p: { xs: 1, sm: 2 }, minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '30px', background: '#fff', maxWidth: 500, width: '100%', mb: 2, boxShadow: 'none' }} className={shake ? 'shake' : ''}>
            <audio ref={beepAudio} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
            <Typography align="center" sx={{ fontSize: { xs: '4.2rem', sm: '5.2rem', md: '6rem' }, fontWeight: 700, color: '#FFC663', mb: 0.7, letterSpacing: '0.05em', lineHeight: 1 }}>
              {formatTime(timeLeft)}
            </Typography>
          </Box>
          {/* Timer Controls */}
          <Box display="flex" justifyContent="center" gap={3} sx={{ width: '100%', mt: 0.7 }}>
            <Button variant="contained" className="timer-btn start" sx={{ backgroundColor: '#C6E8FF !important', color: '#222 !important', minWidth: 100, borderRadius: '12px', fontWeight: 500, fontSize: '1.1rem', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }} onClick={handleStart} disabled={isRunning && !isPaused}>
              Start
            </Button>
            <Button variant="contained" className="timer-btn pause" sx={{ backgroundColor: '#F3FFD6 !important', color: '#222 !important', minWidth: 100, borderRadius: '12px', fontWeight: 500, fontSize: '1.1rem', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }} onClick={handlePause} disabled={!isRunning || isPaused}>
              Pause
            </Button>
            <Button variant="contained" className="timer-btn reset" sx={{ backgroundColor: '#FFCBE1 !important', color: '#222 !important', minWidth: 100, borderRadius: '12px', fontWeight: 500, fontSize: '1.1rem', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }} onClick={handleReset}>
              Reset
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default App;
