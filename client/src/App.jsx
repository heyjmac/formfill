import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Evals } from './pages/Evals';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/evals" element={<Evals />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
};
