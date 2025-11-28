import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import CreateBlock from './pages/CreateBlock';
import EditBlock from './pages/EditBlock';
import Analytics from './pages/Analytics';
import Integrations from './pages/Integrations';
import Account from './pages/Account';
import AIAssistant from './pages/AIAssistant';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';

// Placeholder components for new navigation items
const ProductLibrary = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Product Library</h1>
    <p>Filter by: Source (Shopify, Amazon, Walmart)</p>
    <p>Sort by: Price, Clicks, Rating</p>
    <p>Add new product</p>
    <p>Tag: [Top Pick] [On Sale] [Low Stock]</p>
  </div>
);

const Billing = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Billing</h1>
    <p>Current Plan: [Pro]</p>
    <p>Upgrade / Downgrade</p>
    <p>Payment method</p>
    <p>Invoice History</p>
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Don't render anything while loading
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes */}
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="blocks" element={<Blocks />} />
        <Route path="blocks/new" element={<CreateBlock />} />
        <Route path="blocks/:id/edit" element={<EditBlock />} />
        <Route path="products" element={<ProductLibrary />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
        <Route path="account" element={<Account />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
