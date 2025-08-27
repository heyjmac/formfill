import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/evals" element={<div />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
};
