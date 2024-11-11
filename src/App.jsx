import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';

const Home = React.lazy(() => import('./components/Home'));
const Questionnaire = React.lazy(() => import('./components/Questionnaire'));
const Results = React.lazy(() => import('./components/Results'));
const JoinSession = React.lazy(() => import('./components/JoinSession'));
const DatabaseManager = React.lazy(() => import('./components/DatabaseManager'));
const CategoryManager = React.lazy(() => import('./components/CategoryManager'));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/questionnaire/:sessionId" element={<Questionnaire />} />
              <Route path="/results/:sessionId" element={<Results />} />
              <Route path="/join" element={<JoinSession />} />
              <Route path="/database" element={<DatabaseManager />} />
              <Route path="/categories" element={<CategoryManager />} />
            </Routes>
          </Suspense>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;