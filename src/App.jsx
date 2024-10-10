import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Questionnaire from './components/Questionnaire';
import Results from './components/Results';
import JoinSession from './components/JoinSession';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire/:sessionId" element={<Questionnaire />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/join" element={<JoinSession />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;