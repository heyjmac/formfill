import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Evals } from './pages/Evals';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/form" element={<Home />} />
        <Route path="/*" element={<Evals />} />
      </Routes>
    </Router>
  );
};
