import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import Login from './Login';
import Home from './Home';
import Main from './Main';
import Report from './Report';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const newUserId = uuidv4();
    setUserId(newUserId);
    localStorage.setItem('userId', newUserId);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />}/>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/monthly-report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
