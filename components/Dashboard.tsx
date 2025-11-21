import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, WeightEntry } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  Flame, Scale, Trophy, Calendar, Plus, ArrowUpRight, ArrowDownRight, Activity, User, Settings, Loader2, Dumbbell, Save, Edit2, Zap
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  
  // User Goals & Biometrics
  const [calorieGoal, setCalorieGoal] = useState<number>(2600);
  const [weightGoal, setWeightGoal] = useState<number>(75);
  const [height, setHeight] = useState<number>(175); // cm
  const [currentPhase, setCurrentPhase] = useState<'volumen' | 'definicion' | 'mantenimiento'>('volumen');
  const [displayName, setDisplayName] = useState<string>('');
  
  // Data & History
  const [workoutCount, setWorkoutCount] = useState<number>(0);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number>(66);
  const [startWeight, setStartWeight] = useState<number>(66);
  
  // Consistency Data (Real)
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; val: number; date: string; realCount: number }[]>([]);
  const [hasWeeklyActivity, setHasWeeklyActivity] = useState(false);
  
  // UI State
  const [weightInput, setWeightInput] = useState<string>('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingWeightDirectly, setIsEditingWeightDirectly] = useState(false);
  
  // Temp state for editing current weight directly
  const [editCurrentWeight, setEditCurrentWeight] = useState<number>(66);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // 1. DB: Get Workout Count (Total)
        const { data, error } = await supabase.rpc('count_distinct_workout_days');
        if (!error) setWorkoutCount(data || 0);

        // 2. Calculate Weekly Consistency (Real Data)
        await calculateWeeklyConsistency();

        // 3. LocalStorage: Load Settings & History
        const storedCal = localStorage.getItem(`goal_calories_${user.id}`);
        if (storedCal) setCalorieGoal(parseInt(storedCal));

        const storedWeightGoal = localStorage.getItem(`goal_weight_${user.id}`);
        if (storedWeightGoal) setWeightGoal(parseFloat(storedWeightGoal));

        const storedHeight = localStorage.getItem(`user_height_${user.id}`);
        if (storedHeight) setHeight(parseInt(storedHeight));

        const storedPhase = localStorage.getItem(`user_phase_${user.id}`);
        if (storedPhase) setCurrentPhase(storedPhase as any);

        const storedName = localStorage.getItem(`user_display_name_${user.id}`);
        if (storedName) {
            setDisplayName(storedName);
        } else {
            setDisplayName(user.email ? user.email.split('@')[0] : 'Atleta');
        }

        const storedHistory = localStorage.getItem(`weight_history_${user.id}`);
        if (storedHistory) {
            const parsed: WeightEntry[] = JSON.parse(storedHistory);
            parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setWeightHistory(parsed);
            if(parsed.length > 0) {
                const lastW = parsed[parsed.length - 1].weight;
                setCurrentWeight(lastW);
                setEditCurrentWeight(lastW);
                setStartWeight(parsed[0].weight);
            }
        } else {
            // Default starter data
            setWeightHistory([{ date: new Date().toISOString().split('T')[0], weight: 66 }]);
            setCurrentWeight(66);
            setEditCurrentWeight(66);
            setStartWeight(66);
        }

      } catch (err) {
        console.error('Error initializing dashboard:', err);
      } finally {
        // Small delay for smooth animation
        setTimeout(() => setLoading(false), 500);
      }
    };

    initializeData();
  }, [user.id, user.email]);

  //Helper to fetch and calculate real consistency
  const calculateWeeklyConsistency = async () => {
      // Get start of current week (Monday)
      const curr = new Date();
      const dayOfWeek = curr.getDay(); // 0 (Sun) - 6 (Sat)
      // Adjust so Monday is 0, Sunday is 6 for calculation relative to Monday
      const diffToMonday = (dayOfWeek + 6) % 7;
      
      const monday = new Date(curr);
      monday.setDate(curr.getDate() - diffToMonday);
      
      // Create array of dates for current week
      const weekDates: string[] = [];
      const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          // Format as DD/MM/YYYY to match DB
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          weekDates.push(`${day}/${month}/${year}`);
      }

      // Fetch workouts for this user
      const { data: workouts } = await supabase
        .from('Entrenamientos')
        .select('Date, WorkoutID')
        .eq('user_id', user.id);

      if (workouts) {
          const activityMap: Record<string, number> = {};
          let totalActivity = 0;

          workouts.forEach(w => {
              // Normalize date from DB (could be D/M/YYYY or DD/MM/YYYY)
              const parts = w.Date.split('/');
              if(parts.length === 3) {
                  const normalizedDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
                  if (weekDates.includes(normalizedDate)) {
                      if(!activityMap[normalizedDate]) activityMap[normalizedDate] = 0;
                      activityMap[normalizedDate] += 1; 
                  }
              }
          });

          const graphData = weekDates.map((date, index) => {
              const count = activityMap[date] || 0;
              if (count > 0) totalActivity++;
              // Normalize for chart height (e.g., max 100)
              return {
                  day: labels[index],
                  val: count > 0 ? Math.min(100, count * 20 + 20) : 0, // Make bars visible
                  date: date,
                  realCount: count
              };
          });

          setWeeklyActivity(graphData);
          setHasWeeklyActivity(totalActivity > 0);
      }
  };

  // --- HANDLERS ---

  const saveBio = () => {
      localStorage.setItem(`goal_calories_${user.id}`, calorieGoal.toString());
      localStorage.setItem(`goal_weight_${user.id}`, weightGoal.toString());
      localStorage.setItem(`user_height_${user.id}`, height.toString());
      localStorage.setItem(`user_phase_${user.id}`, currentPhase);
      localStorage.setItem(`user_display_name_${user.id}`, displayName);

      // Check if current weight was edited via bio edit
      if (editCurrentWeight !== currentWeight) {
          handleManualCurrentWeightUpdate(editCurrentWeight);
      }

      setIsEditingBio(false);
  };

  const saveDirectWeight = () => {
      handleManualCurrentWeightUpdate(editCurrentWeight);
      setIsEditingWeightDirectly(false);
  };

  const handleManualCurrentWeightUpdate = (newWeight: number) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Create a shallow copy of the array
      const newHistory = [...weightHistory];
      const existingIndex = newHistory.findIndex(h => h.date === today);
      
      if (existingIndex >= 0) {
          newHistory[existingIndex] = { 
              ...newHistory[existingIndex], 
              weight: newWeight 
          };
      } else {
          newHistory.push({ date: today, weight: newWeight });
      }
      
      newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setWeightHistory(newHistory);
      setCurrentWeight(newWeight);
      localStorage.setItem(`weight_history_${user.id}`, JSON.stringify(newHistory));
  };

  const addWeightEntry = () => {
      const w = parseFloat(weightInput);
      if (isNaN(w) || w <= 0) return;
      handleManualCurrentWeightUpdate(w);
      setWeightInput('');
      setEditCurrentWeight(w); // Sync edit input
  };

  // --- CALCULATIONS ---

  const weightChangeTotal = currentWeight - startWeight;
  const weightProgressPercent = Math.min(100, Math.max(0, ((currentWeight - startWeight) / (weightGoal - startWeight)) * 100));
  const bmi = (currentWeight / ((height/100) ** 2)).toFixed(1);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
              <div className="relative">
                  <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full animate-pulse"></div>
                  <Loader2 className="w-12 h-12 text-brand animate-spin relative z-10" />
              </div>
              <p className="text-slate-400 font-bold mt-4 tracking-wide">Sincronizando datos...</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)] animate-pulse"></div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Panel de Control</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-2 h-12">
                Hola, 
                {isEditingBio ? (
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-transparent border-b-4 border-brand text-4xl font-black text-slate-800 focus:outline-none w-auto min-w-[200px] px-1 capitalize transition-all"
                        placeholder="Tu nombre"
                        autoFocus
                    />
                ) : (
                    <span className="capitalize text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">{displayName}</span>
                )}
                <span className="text-4xl animate-float">👋</span>
            </h2>
          </div>
          
          <button 
            onClick={isEditingBio ? saveBio : () => setIsEditingBio(true)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border shadow-sm transform active:scale-95 duration-200 ${
                isEditingBio 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg hover:bg-slate-800' 
                : 'bg-white/80 border-white text-slate-600 hover:text-brand hover:shadow-md backdrop-blur-sm'
            }`}
          >
              {isEditingBio ? <Save size={18} /> : <Settings size={18} />} 
              {isEditingBio ? 'Guardar Perfil' : 'Ajustes'}
          </button>
      </div>

      {/* Main Bento Grid - 3D Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. Profile & Bio Card (Span 4) */}
        <div className="md:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-card hover:shadow-card-hover border border-white/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group animate-slide-up" style={{animationDelay: '0.1s'}}>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brandLight/50 to-accent/20 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-5 mb-6">
                    <div className="h-20 w-20 rounded-3xl bg-white shadow-lg shadow-indigo-500/10 flex items-center justify-center text-brand border border-indigo-50 transform transition-transform group-hover:rotate-3">
                        <User size={36} strokeWidth={2.5} />
                    </div>
                    <div className="w-full">
                        <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Fase Actual</p>
                        {isEditingBio ? (
                            <div className="relative">
                                <select 
                                    value={currentPhase}
                                    onChange={(e) => setCurrentPhase(e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold px-4 py-2.5 w-full outline-none focus:ring-2 focus:ring-brand shadow-inner-soft appearance-none"
                                >
                                    <option value="volumen">Volumen</option>
                                    <option value="definicion">Definición</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                </select>
                                <ArrowDownRight className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
                            </div>
                        ) : (
                            <h3 className="text-2xl font-black text-slate-800 capitalize flex items-center gap-2">
                                {currentPhase} 
                                <span className="text-lg bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
                                    {currentPhase === 'volumen' && '🔥'}
                                    {currentPhase === 'definicion' && '✂️'}
                                    {currentPhase === 'mantenimiento' && '⚖️'}
                                </span>
                            </h3>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                        <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">Altura</p>
                        {isEditingBio ? (
                             <input type="number" value={height} onChange={(e)=>setHeight(Number(e.target.value))} className="w-full bg-slate-50 border-b-2 border-brand rounded px-1 py-0.5 text-lg font-bold outline-none" />
                        ) : (
                            <p className="text-xl font-black text-slate-700">{height} <span className="text-sm font-medium text-slate-400">cm</span></p>
                        )}
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                        <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">BMI</p>
                        <p className="text-xl font-black text-slate-700">{bmi}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Nutrition Target (Span 4) - Dark/Neon Card */}
        <div className="md:col-span-4 glass-panel-dark rounded-[2rem] p-6 shadow-float text-white flex flex-col relative overflow-hidden group animate-slide-up" style={{animationDelay: '0.2s'}}>
             {/* Glowing background effect */}
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand/30 blur-[60px] rounded-full pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-neon">
                    <Flame size={24} className="text-orange-400 fill-orange-400/20"/>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Objetivo Diario</p>
                    {isEditingBio ? (
                         <input type="number" value={calorieGoal} onChange={(e)=>setCalorieGoal(Number(e.target.value))} className="w-28 bg-white/5 border-b border-brand rounded-t px-2 py-1 text-3xl font-black text-right mt-1 text-white outline-none" />
                    ) : (
                        <p className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{calorieGoal}</p>
                    )}
                    <p className="text-slate-500 text-xs font-bold uppercase mt-1">Kilocalorías</p>
                </div>
             </div>
             
             <div className="mt-auto space-y-4 relative z-10">
                <div className="flex justify-between text-sm font-bold text-slate-300">
                    <span>Balance de Macros</span>
                    <span className="text-brandLight"><Zap size={14} className="inline mr-1" fill="currentColor"/>Optimizado</span>
                </div>
                {/* Custom 3D-like Progress Bar */}
                <div className="h-5 rounded-full overflow-hidden bg-slate-800/50 border border-white/5 shadow-inner-soft flex relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none z-20"></div>
                    <div className="bg-emerald-500 w-[50%] h-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                    <div className="bg-blue-500 w-[25%] h-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
                    <div className="bg-amber-500 w-[25%] h-full shadow-[0_0_10px_rgba(245,158,11,0.4)]"></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div> 50% Carb</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div> 25% Prot</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div> 25% Fat</span>
                </div>
             </div>
        </div>

        {/* 3. Weight Progress (Span 4) */}
        <div className="md:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-card hover:shadow-card-hover border border-white/60 transition-all duration-300 hover:-translate-y-1 flex flex-col animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="flex justify-between items-start mb-6">
                <div className="w-full">
                    <div className="flex justify-between items-start pr-2">
                        <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Peso Actual</p>
                        {!isEditingBio && !isEditingWeightDirectly && (
                            <button 
                                onClick={() => setIsEditingWeightDirectly(true)}
                                className="text-slate-300 hover:text-brand transition-colors p-1 hover:bg-brand/10 rounded-lg"
                                title="Editar peso"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        {isEditingWeightDirectly && (
                             <button 
                                onClick={saveDirectWeight}
                                className="text-white bg-brand hover:bg-brandDark transition-colors p-1.5 rounded-lg shadow-lg shadow-brand/30"
                                title="Guardar peso"
                            >
                                <Save size={14} />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-baseline gap-3">
                        {isEditingBio || isEditingWeightDirectly ? (
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    value={editCurrentWeight} 
                                    onChange={(e)=>setEditCurrentWeight(parseFloat(e.target.value))} 
                                    className="w-28 bg-slate-50 border-b-2 border-brand rounded-t px-2 py-1 text-3xl font-black text-slate-800 focus:outline-none shadow-inner-soft" 
                                    step="0.1"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <h3 className="text-4xl font-black text-slate-800 cursor-pointer tracking-tight" onClick={() => setIsEditingWeightDirectly(true)}>
                                {currentWeight} <span className="text-lg font-bold text-slate-400">kg</span>
                            </h3>
                        )}
                        
                        {(!isEditingBio && !isEditingWeightDirectly && weightChangeTotal !== 0) && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center border ${
                                weightChangeTotal > 0 
                                ? (currentPhase === 'volumen' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100') 
                                : (currentPhase === 'definicion' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100')
                            }`}>
                                {weightChangeTotal > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                {Math.abs(weightChangeTotal).toFixed(1)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-brand to-brandDark text-white rounded-2xl shadow-lg shadow-brand/20 shrink-0 rotate-3">
                    <Scale size={24}/>
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex justify-between items-end mb-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Inicio: {startWeight}kg</div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-brand uppercase mb-0.5">Meta</div>
                        {isEditingBio ? (
                             <input type="number" value={weightGoal} onChange={(e)=>setWeightGoal(Number(e.target.value))} className="w-16 bg-slate-50 border-b border-brand rounded px-1 py-0.5 text-sm font-bold text-right" />
                        ) : (
                            <div className="font-black text-slate-800">{weightGoal} kg</div>
                        )}
                    </div>
                </div>
                {/* Liquid Tube Progress Bar */}
                <div className="h-3 bg-slate-100 rounded-full relative shadow-inner-soft overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand to-accent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.abs(weightProgressPercent)}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. Main Chart (Span 8) */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-card border border-white/60 min-h-[380px] flex flex-col animate-slide-up relative" style={{animationDelay: '0.4s'}}>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-brand/10 rounded-xl text-brand">
                        <Activity size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800">Evolución</h3>
                        <p className="text-xs text-slate-400 font-semibold">Tendencia de peso corporal</p>
                     </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner-soft">
                    <input 
                        type="number" 
                        placeholder="KG" 
                        className="w-20 bg-white rounded-xl border border-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none font-bold text-slate-700 shadow-sm"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                    />
                    <button 
                        onClick={addWeightEntry}
                        disabled={!weightInput}
                        className="bg-slate-900 text-white p-2 rounded-xl hover:bg-brand transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20 active:scale-90"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory}>
                    <defs>
                      <linearGradient id="colorWeightPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(str) => {
                            const d = new Date(str);
                            return `${d.getDate()}/${d.getMonth()+1}`;
                        }}
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                        minTickGap={30}
                        dy={10}
                    />
                    <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                        width={30}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            backdropFilter: 'blur(8px)',
                            borderRadius: '16px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: '#fff',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                        }} 
                        itemStyle={{color: '#fff', fontWeight: 'bold'}}
                        labelStyle={{color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'}}
                        cursor={{stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5'}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorWeightPro)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 5. Weekly Consistency (Span 4) */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-card border border-white/60 flex flex-col animate-slide-up min-h-[280px] hover:-translate-y-1 transition-transform duration-300" style={{animationDelay: '0.5s'}}>
             <div className="flex justify-between items-start mb-4">
                <div>
                     <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
                        Consistencia
                     </h3>
                     <p className="text-xs text-slate-400 font-semibold">Sesiones esta semana</p>
                </div>
                <div className="bg-amber-50 text-amber-500 p-2.5 rounded-2xl border border-amber-100 shadow-sm">
                     <Trophy size={22}/>
                </div>
             </div>
             
             <div className="w-full flex-1 min-h-[180px]">
                 {hasWeeklyActivity ? (
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={weeklyActivity} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                             <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#cbd5e1', fontSize: 12, fontWeight: 700}}
                                dy={10}
                             />
                             <Tooltip 
                                cursor={{fill: '#f8fafc', radius: 8}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                                labelStyle={{display: 'none'}}
                                formatter={(val: number, name: string, props: any) => {
                                    return [props.payload.realCount + " sesiones", ""];
                                }}
                             />
                             <Bar dataKey="val" radius={[8, 8, 8, 8]}>
                                {weeklyActivity.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.val > 0 ? 'url(#colorGradientBar)' : '#f1f5f9'} 
                                        className="transition-all duration-500 hover:opacity-80"
                                    />
                                ))}
                             </Bar>
                             <defs>
                                <linearGradient id="colorGradientBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#4338ca" />
                                </linearGradient>
                             </defs>
                         </BarChart>
                     </ResponsiveContainer>
                 ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 group">
                         <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                             <Dumbbell size={24} className="text-slate-300" />
                         </div>
                         <p className="text-sm font-bold text-slate-500">Sin actividad</p>
                         <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">¡Ve a entrenar!</p>
                     </div>
                 )}
             </div>
             
             <div className="mt-4 bg-slate-50/80 p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-inner-soft">
                 <div>
                     <p className="text-[10px] text-slate-400 font-extrabold uppercase">Total</p>
                     <p className="text-2xl font-black text-slate-800">{workoutCount}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">Semana</p>
                    <p className="text-2xl font-black text-brand">
                        {weeklyActivity.filter(d => d.val > 0).length} <span className="text-sm text-slate-400 font-bold">días</span>
                    </p>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;