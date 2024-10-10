import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import Questionnaire from './components/Questionnaire'
import Results from './components/Results'
import JoinSession from './components/JoinSession'
import ShareSession from './components/ShareSession'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questionnaire/:sessionId" element={<Questionnaire />} />
        <Route path="/results/:sessionId" element={<Results />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/share/:sessionId" element={<ShareSession />} />
      </Routes>
    </Router>
  )
}

export default App