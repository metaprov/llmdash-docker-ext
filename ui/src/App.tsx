import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Stats from './pages/Stats/Stats';
import Chat from './pages/Chat/Chat';
import Settings from './pages/Settings/Settings'
import NavBar from './components/NavBar/NavBar';

export default function App() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<Stats />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Box>
  );
}
