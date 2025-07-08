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
    if (name === "") {
      setRoutineName("");
      setSets([{ work: 0, rest: 0 }]);
      setRepeat(1);
      return;
    }
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
    // Store in seconds, but user enters minutes
    const newSets = sets.map((set, i) =>
      i === index ? { ...set, [field]: value * 60 } : set
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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: '#E6F3FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        p: { xs: 0, sm: 0, md: 0 },
      }}
    >
      {/* Options Tab only visible when Drawer is closed */}
      {!drawerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 100, sm: '50%' },
            left: 0,
            zIndex: 1301,
            transform: { xs: 'none', sm: 'translateY(-50%)' },
          }}
        >
          <Button
            onClick={() => setDrawerOpen(true)}
            sx={{
              borderRadius: { xs: '0 12px 12px 0', sm: '0 12px 12px 0' },
              background: '#fff',
              color: '#222',
              fontWeight: 500,
              px: { xs: 0.5, sm: 1 },
              py: 0,
              minWidth: 0,
              width: { xs: 40, sm: 40 },
              height: { xs: 100, sm: 100 },
              mt: { xs: 1, sm: 0 },
              mb: { xs: 1, sm: 0 },
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: { xs: '0.95rem', sm: '0.75rem' },
              letterSpacing: '0.03em',
              pointerEvents: 'auto',
              zIndex: 1400,
              '&:hover': { background: '#F0F8FF' },
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
            width: { xs: '100vw', sm: 400 },
            maxWidth: { xs: '100vw', sm: 480 },
            borderRadius: 0,
            background: '#fff',
            p: { xs: 1, sm: 2, md: 4 },
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
            overflow: 'visible',
          },
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
            color: '#87CEEB',
            background: '#fff',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
            '&:hover': { background: '#F0F8FF' },
            display: { xs: 'flex', sm: 'flex' },
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
            px: { xs: 0.5, sm: 1 },
            py: 0,
            minWidth: 0,
            width: { xs: 40, sm: 40 },
            height: { xs: 100, sm: 100 },
            mt: { xs: 1, sm: 0 },
            mb: { xs: 1, sm: 0 },
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
            pointerEvents: 'auto',
            zIndex: 1400,
            display: { xs: 'none', sm: 'flex' },
            '&:hover': { background: '#F0F8FF' },
          }}
        >
          Options
        </Button>
        <Box sx={{ width: '100%' }}>
          {/* In the Drawer, ensure the order is:
              // 1. Select Routine dropdown
              // 2. Routine Name input
              // 3. Sets, Repeat, Save, Delete, etc. */}
          <Box sx={{ width: '100%', mb: { xs: 1.5, sm: 2.5 } }}>
            <select
              value={selectedRoutine}
              onChange={handleRoutineSelect}
              style={{
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid #87CEEB',
                padding: '0 40px 0 16px',
                color: '#87CEEB',
                background: '#fff',
                fontWeight: 600,
                fontSize: '1.15rem',
                fontFamily: 'inherit',
                lineHeight: 1.3,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                outline: 'none',
                boxShadow: 'none',
                backgroundImage:
                  'url("data:image/svg+xml;utf8,<svg fill=\'%2387CEEB\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px 20px',
                cursor: 'pointer',
                whiteSpace: 'normal',
                overflow: 'visible',
                textOverflow: 'clip',
                boxSizing: 'border-box',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                marginBottom: 16,
              }}
            >
              <option value="" style={{color: '#87CEEB', fontSize: 'inherit', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere'}}>
                SELECT ROUTINE
              </option>
              {savedRoutines.map(r => (
                <option key={r.name} value={r.name} style={{color: '#87CEEB', fontSize: 'inherit', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere'}}>
                  {r.name}
                </option>
              ))}
            </select>
          </Box>
          <Box className="routine-name-box" sx={{ width: '100%', mb: 0.7 }}>
            <TextField
              label="Routine Name"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              fullWidth
              sx={{
                mb: 2,
                backgroundColor: '#fff',
                color: '#4682B4',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  borderColor: '#87CEEB',
                  backgroundColor: '#fff',
                  color: '#4682B4',
                },
                '& .MuiInputLabel-root': {
                  color: '#4682B4',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#87CEEB',
                },
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
              InputLabelProps={{ style: { color: '#4682B4' } }}
              inputProps={{ style: { color: '#4682B4' } }}
            />
          </Box>
          <Box className="sets-box" sx={{ width: '100%', mb: 0 }}>
            {sets.map((set, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  mb: 3,
                  columnGap: 2,
                  rowGap: { xs: 1, sm: 0 },
                }}
              >
                <TextField
                  label="Work (mins)"
                  type="number"
                  value={set.work === 0 ? '' : set.work / 60}
                  onChange={e => handleSetChange(idx, 'work', Number(e.target.value))}
                  fullWidth
                  id={`work-input-${idx}`}
                  sx={{
                    mr: { xs: 0, sm: 1 },
                    mb: { xs: 1, sm: 0 },
                    backgroundColor: '#fff',
                    color: '#4682B4',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      borderColor: '#87CEEB',
                      backgroundColor: '#fff',
                      color: '#4682B4',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4682B4',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#87CEEB',
                    },
                  }}
                  InputLabelProps={{ style: { color: '#4682B4' }, shrink: true }}
                  inputProps={{ min: 0, style: { color: '#4682B4' } }}
                />
                <TextField
                  label="Rest (mins)"
                  type="number"
                  value={set.rest === 0 ? '' : set.rest / 60}
                  onChange={e => handleSetChange(idx, 'rest', Number(e.target.value))}
                  fullWidth
                  id={`rest-input-${idx}`}
                  sx={{
                    ml: { xs: 0, sm: 1 },
                    mr: { xs: 0, sm: 1 },
                    mb: { xs: 1, sm: 0 },
                    backgroundColor: '#fff',
                    color: '#4682B4',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      borderColor: '#87CEEB',
                      backgroundColor: '#fff',
                      color: '#4682B4',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4682B4',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#87CEEB',
                    },
                  }}
                  InputLabelProps={{ style: { color: '#4682B4' }, shrink: true }}
                  inputProps={{ min: 0, style: { color: '#4682B4' } }}
                />
                <IconButton
                  onClick={() => handleDeleteSet(idx)}
                  disabled={sets.length === 1}
                  sx={{ ml: { xs: 0, sm: 1 }, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                >
                  <DeleteIcon sx={{ color: '#5F9EA0' }} />
                </IconButton>
              </Box>
            ))}
            <Button
              onClick={handleAddSet}
              sx={{
                color: '#5F9EA0',
                fontWeight: 600,
                background: 'none',
                boxShadow: 'none',
                mt: 0,
                mb: 0,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                marginBottom: 0,
                '&:hover': { color: '#4682B4', background: 'none' },
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
                color: '#4682B4',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  borderColor: '#87CEEB',
                  backgroundColor: '#fff',
                  color: '#4682B4',
                },
                '& .MuiInputLabel-root': {
                  color: '#4682B4',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#87CEEB',
                },
                mt: 0,
                marginTop: 0,
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
              InputLabelProps={{ style: { color: '#4682B4' } }}
              inputProps={{ min: 1, style: { color: '#4682B4' } }}
            />
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Button
              variant="outlined"
              onClick={saveRoutine}
              sx={{
                background: '#fff',
                borderColor: '#87CEEB',
                color: '#87CEEB',
                fontWeight: 600,
                borderRadius: 2,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                '&:hover': {
                  borderColor: '#5F9EA0',
                  color: '#5F9EA0',
                  background: '#fff',
                },
              }}
            >
              Save Routine
            </Button>
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2.5 } }}>
            <Button
              variant="outlined"
              color="error"
              disabled={!selectedRoutine}
              onClick={() => {
                if (!selectedRoutine) return;
                if (window.confirm('정말 이 루틴을 삭제할까요?')) {
                  const updatedRoutines = savedRoutines.filter(r => r.name !== selectedRoutine);
                  setSavedRoutines(updatedRoutines);
                  localStorage.setItem('routines', JSON.stringify(updatedRoutines));
                  setSelectedRoutine('');
                  setRoutineName('');
                  setSets([{ work: 0, rest: 0 }]);
                  setRepeat(1);
                  alert('루틴이 삭제되었습니다.');
                }
              }}
              sx={{
                background: '#fff',
                borderColor: '#87CEEB',
                color: '#87CEEB',
                fontWeight: 600,
                borderRadius: 2,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                mt: { xs: 1, sm: 2 },
                width: '100%',
                maxWidth: 320,
                '&:hover': {
                  borderColor: '#5F9EA0',
                  color: '#fff',
                  background: '#FF6B6B',
                },
                '&.Mui-disabled': {
                  color: '#b0c4de',
                  borderColor: '#b0c4de',
                  background: '#f5f5f5',
                },
                transition: 'all 0.2s',
              }}
            >
              DELETE ROUTINE
            </Button>
          </Box>
        </Box>
      </Drawer>
      {/* Centered Timer Card */}
      <Box
        sx={{
          position: { xs: 'static', sm: 'fixed' },
          display: { xs: 'flex', sm: 'block' },
          flexDirection: { xs: 'column', sm: 'initial' },
          alignItems: { xs: 'center', sm: 'initial' },
          justifyContent: { xs: 'center', sm: 'initial' },
          minHeight: { xs: '100vh', sm: 'auto' },
          top: { xs: 'auto', sm: '50%' },
          left: { xs: 'auto', sm: '50%' },
          transform: { xs: 'none', sm: 'translate(-50%, -50%)' },
          zIndex: 1200,
          width: { xs: '100vw', sm: '95vw', md: 500 },
          maxWidth: { xs: '100vw', sm: 600 },
          minWidth: 0,
          px: { xs: 0, sm: 0 },
          boxSizing: 'border-box',
          height: { xs: '100vh', sm: 'auto' },
          maxHeight: { xs: '100vh', sm: 'none' },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            position: { xs: 'static', sm: 'relative' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: { xs: 0.5, sm: 2, md: 4 },
            borderRadius: { xs: 0, sm: '30px' },
            background: '#fff',
            boxShadow: { xs: 'none', sm: '0 2px 16px 0 rgba(0,0,0,0.06)' },
            maxWidth: { xs: '100vw', sm: 600 },
            width: { xs: '100vw', sm: 500 },
            minWidth: 0,
            boxSizing: 'border-box',
            maxHeight: { xs: 'calc(100vh - 24px)', sm: 'none' },
            overflowY: { xs: 'auto', sm: 'visible' },
          }}
          className={shake ? 'shake' : ''}
        >
          {/* Timer Display */}
          <Box
            sx={{
              p: { xs: 0.5, sm: 1, md: 2 },
              minHeight: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '30px',
              background: '#fff',
              maxWidth: { xs: '100vw', sm: 500 },
              width: '100%',
              mb: { xs: 0.7, sm: 2 },
              boxShadow: 'none',
            }}
            className={shake ? 'shake' : ''}
          >
            <audio
              ref={beepAudio}
              src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
              preload="auto"
            />
            <Typography
              align="center"
              sx={{
                fontSize: { xs: '2.7rem', sm: '4.2rem', md: '5.2rem', lg: '6rem' },
                fontWeight: 700,
                color: '#87CEEB',
                mb: 0.7,
                letterSpacing: '0.05em',
                lineHeight: 1,
                wordBreak: 'break-word',
              }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>
          {/* Timer Controls */}
          <Box
            display="flex"
            flexDirection={{ xs: 'row', sm: 'row' }}
            justifyContent="center"
            alignItems="center"
            gap={{ xs: 0.7, sm: 3 }}
            sx={{ width: '100%', mt: 0.7, mb: { xs: 0.7, sm: 0 } }}
          >
            <Button
              variant="contained"
              className="timer-btn start"
              sx={{
                backgroundColor: '#C6E8FF !important',
                color: '#222 !important',
                minWidth: { xs: 80, sm: 100 },
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                py: { xs: 1, sm: 1.5 },
              }}
              onClick={handleStart}
              disabled={isRunning && !isPaused}
            >
              Start
            </Button>
            <Button
              variant="contained"
              className="timer-btn pause"
              sx={{
                backgroundColor: '#F3FFD6 !important',
                color: '#222 !important',
                minWidth: { xs: 80, sm: 100 },
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                py: { xs: 1, sm: 1.5 },
              }}
              onClick={handlePause}
              disabled={!isRunning || isPaused}
            >
              Pause
            </Button>
            <Button
              variant="contained"
              className="timer-btn reset"
              sx={{
                backgroundColor: '#FFCBE1 !important',
                color: '#222 !important',
                minWidth: { xs: 80, sm: 100 },
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                py: { xs: 1, sm: 1.5 },
              }}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Box>
        </Paper>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: { xs: 1.5, sm: 2.5 } }}>
          <Typography
            variant="body2"
            sx={{
              color: '#bbb',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              textAlign: 'center',
              width: '100%',
              maxWidth: 500,
              fontWeight: 400,
            }}
          >
            OPTIONS에서 나만의 포모도로 인터벌을 만들어보세요.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default App;
