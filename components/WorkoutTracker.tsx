import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Exercise, UserProfile, WorkoutSet } from '../types';
import { Plus, Trash2, Save, TrendingUp, Dumbbell, X, CheckCircle2, Calendar, Clock, Loader2, AlertCircle, Filter, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WorkoutTrackerProps {
  user: UserProfile;
}

// Estado local para el nuevo flujo de entrenamiento
interface ActiveExercise {
  tempId: string; // ID temporal para la UI
  exerciseId: number;
  nombre: string;
  sets: { weight: string; reps: string }[];
}

// Toast Notification Component (Internal)
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-2xl shadow-float border flex items-center gap-3 animate-slide-down backdrop-blur-md ${
            type === 'success' ? 'bg-white/90 border-green-100 text-green-700' : 'bg-white/90 border-red-100 text-red-700'
        }`}>
            {type === 'success' ? <CheckCircle2 size={22} className="text-green-500 drop-shadow-sm" /> : <AlertCircle size={22} className="text-red-500 drop-shadow-sm" />}
            <span className="font-bold">{message}</span>
        </div>
    );
};

// Custom Modal Component (Internal)
const ConfirmModal = ({ 
    isOpen, 
    title, 
    description, 
    onConfirm, 
    onCancel, 
    loading 
}: { 
    isOpen: boolean, title: string, description: string, onConfirm: () => void, onCancel: () => void, loading: boolean 
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-slide-up border border-white/50">
                <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">{description}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin"/>}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'exercises'>('log');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // --- UI Feedback States ---
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      desc: string;
      onConfirm: () => void;
  }>({ isOpen: false, title: '', desc: '', onConfirm: () => {} });

  // --- LOGGING STATE (Nuevo Flujo) ---
  const [activeSession, setActiveSession] = useState<ActiveExercise[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [finishedWorkout, setFinishedWorkout] = useState(false);

  // --- HISTORY & STATS STATE ---
  const [history, setHistory] = useState<any[]>([]);
  const [selectedStatExercise, setSelectedStatExercise] = useState<string>('');
  const [statData, setStatData] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  
  // Ref for date picker
  const dateInputRef = useRef<HTMLInputElement>(null);

  // --- EXERCISE MANAGEMENT STATE ---
  const [newExerciseName, setNewExerciseName] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);

  // Fetch Exercises
  const fetchExercises = useCallback(async () => {
    const { data, error } = await supabase
      .from('Ejercicios')
      .select('*')
      .order('nombre', { ascending: true });
    if (!error && data) setExercises(data);
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Helper for Toasts
  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
  };

  // --- NUEVO FLUJO DE ENTRENAMIENTO ---

  const addExerciseToSession = (exercise: Exercise) => {
    const newActiveExercise: ActiveExercise = {
      tempId: crypto.randomUUID(),
      exerciseId: exercise.id,
      nombre: exercise.nombre,
      sets: [{ weight: '', reps: '' }]
    };
    setActiveSession([...activeSession, newActiveExercise]);
    setIsSelectorOpen(false);
    showToast('Ejercicio añadido', 'success');
  };

  const removeExerciseFromSession = (tempId: string) => {
    setActiveSession(activeSession.filter(e => e.tempId !== tempId));
  };

  const addSetToExercise = (exerciseTempId: string) => {
    const updatedSession = activeSession.map(ex => {
      if (ex.tempId === exerciseTempId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { weight: lastSet ? lastSet.weight : '', reps: lastSet ? lastSet.reps : '' }]
        };
      }
      return ex;
    });
    setActiveSession(updatedSession);
  };

  const removeSetFromExercise = (exerciseTempId: string, setIndex: number) => {
    const updatedSession = activeSession.map(ex => {
      if (ex.tempId === exerciseTempId) {
        const newSets = ex.sets.filter((_, i) => i !== setIndex);
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    setActiveSession(updatedSession);
  };

  const updateSetData = (exerciseTempId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const updatedSession = activeSession.map(ex => {
      if (ex.tempId === exerciseTempId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    setActiveSession(updatedSession);
  };

  const handleFinishClick = () => {
      if (activeSession.length === 0) return;
      setModalConfig({
          isOpen: true,
          title: 'Terminar Entrenamiento',
          desc: '¿Estás seguro de que quieres guardar y finalizar la sesión actual?',
          onConfirm: finishWorkout
      });
  };

  const finishWorkout = async () => {
    setLoading(true); // Start Spinner in Modal
    
    const workoutId = crypto.randomUUID();
    // Manually construct DD/MM/YYYY to match DB and avoid locale issues
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const todayStr = `${day}/${month}/${year}`;

    const payload: any[] = [];

    activeSession.forEach(ex => {
      ex.sets.forEach((set, index) => {
        if (set.reps && set.weight) {
            payload.push({
              user_id: user.id,
              WorkoutID: workoutId,
              Date: todayStr,
              Exercise: ex.nombre,
              SetNumber: index + 1,
              Reps: parseFloat(set.reps),
              Weight: parseFloat(set.weight)
            });
        }
      });
    });

    if (payload.length === 0) {
        setLoading(false);
        setModalConfig({ ...modalConfig, isOpen: false });
        showToast("Completa al menos una serie válida", "error");
        return;
    }

    const { error } = await supabase.from('Entrenamientos').insert(payload);

    setLoading(false); // Stop spinner
    setModalConfig({ ...modalConfig, isOpen: false }); // Close modal

    if (!error) {
      setFinishedWorkout(true);
      setTimeout(() => {
          setFinishedWorkout(false);
          setActiveSession([]);
          if(activeTab === 'history') fetchHistory(); // Refresh history if active
      }, 3000);
    } else {
      console.error(error);
      showToast('Error al guardar en la base de datos', 'error');
    }
  };

  // --- EXERCISE MANAGEMENT ---

  const addExercise = async () => {
    if (!newExerciseName.trim()) return;
    setAddingExercise(true);
    
    const { error } = await supabase.from('Ejercicios').insert({
      user_id: user.id,
      nombre: newExerciseName.trim()
    });

    setAddingExercise(false);

    if (!error) {
      setNewExerciseName('');
      fetchExercises();
      showToast('Ejercicio creado correctamente', 'success');
    } else {
      showToast('Error o duplicado', 'error');
    }
  };

  const handleDeleteExerciseClick = (id: number) => {
      setModalConfig({
          isOpen: true,
          title: 'Eliminar Ejercicio',
          desc: 'Esto lo borrará de tu lista de selección futura, pero mantendrá el historial histórico.',
          onConfirm: () => deleteExercise(id)
      });
  };

  const deleteExercise = async (id: number) => {
    setLoading(true);
    const previousExercises = [...exercises];
    setExercises(exercises.filter(e => e.id !== id)); // Optimistic

    const { error } = await supabase.from('Ejercicios').delete().eq('id', id);
    
    setLoading(false);
    setModalConfig({ ...modalConfig, isOpen: false });

    if (error) {
        console.error("Error deleting:", error);
        showToast("Error al borrar", "error");
        setExercises(previousExercises); // Rollback
    } else {
        showToast("Ejercicio eliminado", "success");
    }
  };

  // --- HISTORY MANAGEMENT ---

  const handleDeleteSessionClick = (workoutId: string) => {
      setModalConfig({
          isOpen: true,
          title: 'Eliminar Sesión',
          desc: '¿Estás seguro de que quieres eliminar este entrenamiento completo? Esta acción no se puede deshacer.',
          onConfirm: () => deleteWorkoutSession(workoutId)
      });
  };

  const deleteWorkoutSession = async (workoutId: string) => {
      setLoading(true);
      // Optimistic Update
      const previousHistory = [...history];
      setHistory(history.filter(h => h.id !== workoutId));

      const { error } = await supabase
          .from('Entrenamientos')
          .delete()
          .eq('WorkoutID', workoutId);

      setLoading(false);
      setModalConfig({ ...modalConfig, isOpen: false });

      if (error) {
          console.error("Error deleting workout:", error);
          showToast("Error al eliminar la sesión", "error");
          setHistory(previousHistory); // Rollback
      } else {
          showToast("Sesión eliminada correctamente", "success");
      }
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Entrenamientos')
      .select('*')
      .order('Date', { ascending: false }); 
    
    if (!error && data) {
      const grouped = data.reduce((acc: any, curr: WorkoutSet) => {
        const id = curr.WorkoutID;
        if (!acc[id]) {
           // Robustly determine ISO date for filtering
           let isoDate = curr.Date;
           if(curr.Date && curr.Date.includes('/')) {
               const [d, m, y] = curr.Date.split('/');
               isoDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
           }
           acc[id] = { id, date: curr.Date, isoDate, exercises: {} };
        }
        if (!acc[id].exercises[curr.Exercise]) {
            acc[id].exercises[curr.Exercise] = [];
        }
        acc[id].exercises[curr.Exercise].push(curr);
        return acc;
      }, {});
      
      const sortedHistory = Object.values(grouped).sort((a: any, b: any) => {
         // Defensive date parsing
         const parseDate = (dateStr: string) => {
            if (!dateStr) return 0;
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/');
                return new Date(`${y}-${m}-${d}`).getTime();
            }
            return new Date(dateStr).getTime();
         };
         return parseDate(b.date) - parseDate(a.date);
      }); 

      setHistory(sortedHistory);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!selectedStatExercise) return;
    const { data, error } = await supabase
      .from('Entrenamientos')
      .select('*')
      .eq('Exercise', selectedStatExercise);
    
    if (!error && data) {
        const byDate: Record<string, number> = {};
        data.forEach((row: WorkoutSet) => {
            const e1rm = Number(row.Weight) * (1 + Number(row.Reps) / 30);
            
            let isoDate = '';
            if (row.Date.includes('/')) {
                const [d, m, y] = row.Date.split('/');
                isoDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            } else {
                isoDate = row.Date; // Assume ISO or compatible
            }
            
            if (!byDate[isoDate] || e1rm > byDate[isoDate]) {
                byDate[isoDate] = e1rm;
            }
        });

        const chartData = Object.entries(byDate)
            .map(([date, e1rm]) => ({ date, e1rm: Math.round(e1rm) }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setStatData(chartData);
    }
  }, [selectedStatExercise]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  useEffect(() => {
    if (selectedStatExercise) fetchStats();
  }, [selectedStatExercise, fetchStats]);

  // Robust Filter Logic
  const filteredHistory = history.filter(workout => {
    if (!filterDate) return true;
    // filterDate is strictly YYYY-MM-DD from input type="date"
    // workout.isoDate is standardized YYYY-MM-DD computed during fetch
    return workout.isoDate === filterDate;
  });

  // Function to trigger date picker
  const openDatePicker = () => {
    try {
        // @ts-ignore
        dateInputRef.current?.showPicker();
    } catch (e) {
        dateInputRef.current?.focus();
    }
  };

  // --- RENDER ---

  if (finishedWorkout) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center px-4">
              <div className="bg-green-100 text-green-600 p-8 rounded-full mb-6 animate-slide-up shadow-neon border border-green-200">
                  <CheckCircle2 size={64} />
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2 animate-slide-up" style={{animationDelay: '0.1s'}}>¡Brutal!</h2>
              <p className="text-slate-500 mb-8 font-medium animate-slide-up" style={{animationDelay: '0.2s'}}>Entrenamiento registrado con éxito.</p>
              <button 
                onClick={() => { setFinishedWorkout(false); setActiveSession([]); }}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/30 hover:scale-105 transition-transform animate-slide-up" style={{animationDelay: '0.3s'}}
              >
                  Volver al inicio
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-20 relative animate-fade-in">
      {/* Toasts and Modals */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} 
        title={modalConfig.title} 
        description={modalConfig.desc} 
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        onConfirm={modalConfig.onConfirm}
        loading={loading}
      />

      {/* Navigation Tabs - Floating Pill Design */}
      <div className="flex p-1.5 rounded-2xl w-full max-w-lg mx-auto md:mx-0 glass-panel shadow-sm relative z-10">
        {(['log', 'history', 'exercises'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-500 ease-out ${
              activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            {tab === 'log' && 'Registrar'}
            {tab === 'history' && 'Historial'}
            {tab === 'exercises' && 'Ejercicios'}
          </button>
        ))}
      </div>

      {/* --- TAB: LOG WORKOUT --- */}
      {activeTab === 'log' && (
        <div className="space-y-8">
            {/* Header Information */}
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-6 px-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sesión de Hoy</h2>
                    <div className="flex items-center gap-2 mt-2">
                         <div className="bg-brand/10 text-brand p-1.5 rounded-lg">
                            <Calendar size={16}/>
                         </div>
                         <p className="text-slate-500 font-bold text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Active Session List */}
            <div className="space-y-6">
                {activeSession.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center space-y-6 animate-slide-up shadow-card">
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner-soft">
                            <Dumbbell size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 mb-1">Tu rutina está vacía</h3>
                            <p className="text-slate-500 text-sm font-medium">Añade ejercicios para empezar a machacar.</p>
                        </div>
                        <button 
                            onClick={() => setIsSelectorOpen(true)}
                            className="bg-brand text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-brand/30 hover:bg-brandDark hover:-translate-y-1 transition-all active:scale-95"
                        >
                            + Añadir Primer Ejercicio
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Exercise Cards - Physical Card Look */}
                        {activeSession.map((ex, index) => (
                            <div key={ex.tempId} className="bg-white rounded-[1.5rem] shadow-card border border-white overflow-hidden animate-slide-up group hover:shadow-card-hover transition-shadow duration-300" style={{animationDelay: `${index * 0.05}s`}}>
                                {/* Card Header */}
                                <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-black text-slate-800 text-lg tracking-tight">{ex.nombre}</h3>
                                    <button 
                                        onClick={() => removeExerciseFromSession(ex.tempId)}
                                        className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Quitar ejercicio"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Sets Table */}
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-10 gap-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                        <div className="col-span-1 text-center self-end">#</div>
                                        <div className="col-span-4 text-center self-end">Kilos</div>
                                        <div className="col-span-4 text-center self-end">Reps</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {ex.sets.map((set, idx) => (
                                        <div key={idx} className="grid grid-cols-10 gap-4 items-center animate-fade-in">
                                            <div className="col-span-1 flex justify-center">
                                                <span className="bg-slate-100 text-slate-600 w-7 h-7 flex items-center justify-center rounded-full text-xs font-black shadow-inner-soft border border-slate-200">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            <div className="col-span-4">
                                                <input 
                                                    type="number" 
                                                    placeholder="-"
                                                    className="w-full bg-slate-50 border border-transparent hover:border-slate-200 focus:border-brand text-slate-900 font-black text-center py-2.5 rounded-xl focus:ring-4 focus:ring-brand/10 outline-none text-xl transition-all shadow-inner-soft"
                                                    value={set.weight}
                                                    onChange={(e) => updateSetData(ex.tempId, idx, 'weight', e.target.value)}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <input 
                                                    type="number" 
                                                    placeholder="-"
                                                    className="w-full bg-slate-50 border border-transparent hover:border-slate-200 focus:border-brand text-slate-900 font-black text-center py-2.5 rounded-xl focus:ring-4 focus:ring-brand/10 outline-none text-xl transition-all shadow-inner-soft"
                                                    value={set.reps}
                                                    onChange={(e) => updateSetData(ex.tempId, idx, 'reps', e.target.value)}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button 
                                                    onClick={() => removeSetFromExercise(ex.tempId, idx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => addSetToExercise(ex.tempId)}
                                        className="w-full py-3 mt-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-brand/30 hover:text-brand transition-all"
                                    >
                                        + Añadir Serie
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Bottom Actions */}
                        <div className="flex flex-col gap-4 pt-6 animate-fade-in">
                            <button 
                                onClick={() => setIsSelectorOpen(true)}
                                className="w-full bg-white/80 backdrop-blur text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-brand transition-all border border-white shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                <Plus size={20}/> Añadir Ejercicio
                            </button>

                            <button 
                                onClick={handleFinishClick}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-brand to-brandDark text-white py-4 rounded-2xl font-black text-lg hover:shadow-lg hover:shadow-brand/40 hover:scale-[1.01] transition-all flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Terminar Entrenamiento</>}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Exercise Selector Modal/Overlay */}
            {isSelectorOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
                    <div className="bg-white w-full md:max-w-md md:rounded-[2rem] rounded-t-[2rem] h-[85vh] md:h-[600px] flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800">Seleccionar Ejercicio</h3>
                            <button onClick={() => setIsSelectorOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-50">
                             <input 
                                type="text"
                                placeholder="Buscar en tu biblioteca..."
                                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-4 outline-none focus:ring-2 focus:ring-brand transition-all font-medium shadow-sm"
                             />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {exercises.map(ex => (
                                <button 
                                    key={ex.id}
                                    onClick={() => addExerciseToSession(ex)}
                                    className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-brand/30 hover:bg-brand/5 hover:shadow-sm font-bold text-slate-700 transition-all flex justify-between items-center group"
                                >
                                    {ex.nombre}
                                    <div className="bg-brand text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                                        <Plus size={16} />
                                    </div>
                                </button>
                            ))}
                            {exercises.length === 0 && (
                                <div className="text-center py-12 px-4">
                                    <p className="text-slate-400 font-medium mb-2">No has creado ejercicios aún.</p>
                                    <p className="text-xs text-slate-300">Ve a la pestaña "Ejercicios" para crear el primero.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 md:rounded-b-[2rem]">
                             <button onClick={() => {setIsSelectorOpen(false); setActiveTab('exercises');}} className="text-brand text-sm font-bold w-full text-center hover:underline flex items-center justify-center gap-1">
                                 Gestionar Ejercicios <ChevronRight size={14}/>
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- TAB: HISTORY --- */}
      {activeTab === 'history' && (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Graph Card */}
            <div className="bg-white rounded-[2rem] shadow-card border border-white p-6 relative overflow-hidden">
                 {/* Decoration */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand/10 to-transparent rounded-bl-[4rem]"></div>

                 <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 z-10 relative">
                     <div className="p-2 bg-brand text-white rounded-xl shadow-lg shadow-brand/30"><TrendingUp size={18} /></div> 
                     Progreso de Fuerza (e1RM)
                 </h3>
                 <div className="relative z-10">
                    <select 
                        className="w-full mb-8 bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand shadow-inner-soft appearance-none cursor-pointer"
                        onChange={(e) => setSelectedStatExercise(e.target.value)}
                        value={selectedStatExercise}
                    >
                        <option value="">-- Selecciona un ejercicio --</option>
                        {exercises.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400 bg-slate-50 pl-2">▼</div>
                 </div>
                 
                 {selectedStatExercise && statData.length > 0 ? (
                     <div className="h-64 w-full animate-fade-in">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={statData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getDate()}/${d.getMonth()+1}`;
                                    }}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    width={35} 
                                    tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#0f172a', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        color: 'white',
                                        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)'
                                    }}
                                    itemStyle={{color: '#fff', fontWeight: 'bold'}}
                                    labelStyle={{display:'none'}}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="e1rm" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    dot={{fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff'}} 
                                    activeDot={{r: 7, stroke: '#fff', strokeWidth: 3}}
                                />
                            </LineChart>
                         </ResponsiveContainer>
                         <div className="flex justify-center gap-2 mt-4">
                            <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-50 rounded text-slate-400">1RM Estimado</span>
                         </div>
                     </div>
                 ) : (
                     <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                         <Dumbbell size={32} className="mb-3 opacity-20"/>
                         <p className="font-medium">Selecciona un ejercicio para ver datos</p>
                     </div>
                 )}
            </div>

            {/* History List */}
            <div className="space-y-5">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-black text-slate-800 text-xl">Sesiones Pasadas</h3>
                    <div 
                        className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm cursor-pointer hover:border-brand transition-all group select-none"
                        onClick={openDatePicker}
                    >
                        <Filter size={16} className="text-slate-400 group-hover:text-brand transition-colors"/>
                        
                        <span className={`text-xs font-bold ${filterDate ? 'text-brand' : 'text-slate-500'}`}>
                            {filterDate ? filterDate.split('-').reverse().join('/') : 'Filtrar Fecha'}
                        </span>

                        <input 
                            ref={dateInputRef}
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                            style={{colorScheme: 'light'}}
                        />
                        
                        {filterDate && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setFilterDate(''); }} 
                                className="z-10 ml-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center">
                         <Loader2 className="animate-spin text-brand w-10 h-10"/>
                    </div>
                ) : (
                 filteredHistory.map((workout: any, idx) => (
                    <div key={workout.id} className="bg-white rounded-2xl shadow-card border border-white overflow-hidden animate-slide-up hover:shadow-card-hover transition-shadow duration-300" style={{animationDelay: `${idx * 0.05}s`}}>
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="font-black text-slate-700 flex items-center gap-2 text-lg">
                                <span className="text-slate-300">#</span> {workout.date}
                            </div>
                            <button 
                                onClick={() => handleDeleteSessionClick(workout.id)}
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"
                                title="Eliminar entrenamiento"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {Object.entries(workout.exercises).map(([name, sets]: [string, any]) => (
                                <div key={name}>
                                    <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                                        {name}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sets.map((s: WorkoutSet, i: number) => (
                                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono shadow-sm flex items-baseline gap-1 hover:border-brand/50 transition-colors">
                                                <span className="font-black text-slate-800 text-sm">{s.Weight}</span>
                                                <span className="text-slate-400 font-bold">kg</span>
                                                <span className="text-slate-300 mx-1">×</span>
                                                <span className="font-black text-brand">{s.Reps}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )))}
                {filteredHistory.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white/40 backdrop-blur rounded-[2rem] border border-white shadow-sm">
                        <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
                            <Calendar size={32} className="text-slate-300"/>
                        </div>
                        <p className="text-slate-500 font-bold">No hay entrenamientos para mostrar.</p>
                        {filterDate && <p className="text-xs text-brand font-medium mt-2 bg-brand/10 inline-block px-3 py-1 rounded-full">Filtro activo: {filterDate}</p>}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- TAB: EXERCISES --- */}
      {activeTab === 'exercises' && (
          <div className="bg-white rounded-[2rem] shadow-card border border-white p-8 animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Biblioteca de Ejercicios</h2>
              <p className="text-sm text-slate-500 mb-8 font-medium">Gestiona tu lista maestra para usarla en tus rutinas.</p>
              
              <div className="flex gap-3 mb-10">
                  <div className="flex-1 relative">
                    <input 
                        type="text"
                        placeholder="Nombre del nuevo ejercicio..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-5 outline-none focus:ring-2 focus:ring-brand text-slate-900 font-bold transition-all shadow-inner-soft"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                    />
                  </div>
                  <button 
                    onClick={addExercise}
                    disabled={addingExercise}
                    className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                  >
                      {addingExercise ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus size={24} />}
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {exercises.map((ex, idx) => (
                      <div key={ex.id} className="flex justify-between items-center p-4 pl-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-brand/30 transition-all animate-slide-up group" style={{animationDelay: `${idx * 0.03}s`}}>
                          <span className="font-bold text-slate-700 group-hover:text-brand transition-colors">{ex.nombre}</span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteExerciseClick(ex.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100"
                            title="Eliminar ejercicio"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  ))}
              </div>
              {exercises.length === 0 && (
                  <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 font-bold">Tu lista está vacía.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default WorkoutTracker;