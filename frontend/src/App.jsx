import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <div className="container mx-auto p-4 pt-32 pb-20">
          <Routes>
            <Route path="/" element={<ReportIssue />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              } />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
