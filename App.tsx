import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutTracker from './components/WorkoutTracker';
import DietPlan from './components/DietPlan';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
          setUserProfile({ id: session.user.id, email: session.user.email });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserProfile({ id: session.user.id, email: session.user.email });
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Auth /> : <Navigate to="/" replace />} 
        />
        
        <Route 
          path="/" 
          element={session && userProfile ? (
            <Layout>
              <Dashboard user={userProfile} />
            </Layout>
          ) : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/workout" 
          element={session && userProfile ? (
            <Layout>
              <WorkoutTracker user={userProfile} />
            </Layout>
          ) : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/diet" 
          element={session && userProfile ? (
            <Layout>
              <DietPlan />
            </Layout>
          ) : <Navigate to="/login" replace />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
