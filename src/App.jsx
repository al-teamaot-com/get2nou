import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './components/Home';
import Questionnaire from './components/Questionnaire';
import Results from './components/Results';
import JoinSession from './components/JoinSession';
import DatabaseManager from './components/DatabaseManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/database">Database Manager</Link></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire/:sessionId" element={<Questionnaire />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/database" element={<DatabaseManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;