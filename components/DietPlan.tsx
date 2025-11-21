import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Info, Edit3, Save, X, Plus, Check, AlertTriangle, Utensils } from 'lucide-react';

interface Meal {
    name: string;
    details: string;
    kcal: number;
    p: number;
    c: number;
    f: number;
}

interface DayPlan {
    id: string;
    name: string;
    meals: {
        breakfast: Meal;
        lunch: Meal;
        snack: Meal;
        dinner: Meal;
    };
    note?: string;
}

const defaultDietData: DayPlan[] = [
    {
        id: 'mon', name: 'Lunes',
        meals: {
            breakfast: { name: 'Gachas de Avena', details: '80g Avena, 250ml Leche entera, 30g Whey, 1 Plátano, Canela', kcal: 680, p: 35, c: 100, f: 12 },
            lunch: { name: 'Pollo y Arroz', details: '120g Arroz (seco), 140g Pechuga de Pollo, Ensalada verde, 10g Aceite', kcal: 850, p: 40, c: 120, f: 18 },
            snack: { name: 'Sándwich Atún', details: '2 Pan integral, 1 lata Atún, 1 Manzana', kcal: 400, p: 20, c: 65, f: 4 },
            dinner: { name: 'Pescado y Patata', details: '300g Patata, 150g Merluza, Verduras, 10g Aceite', kcal: 650, p: 35, c: 60, f: 25 }
        }
    },
    {
        id: 'tue', name: 'Martes',
        meals: {
            breakfast: { name: 'Tostadas con Huevo', details: '100g pan, tomate, 2 huevos revueltos, 1 naranja', kcal: 650, p: 25, c: 80, f: 20 },
            lunch: { name: 'Pasta Boloñesa', details: '120g Pasta integral, 140g carne picada magra, tomate natural', kcal: 800, p: 45, c: 110, f: 15 },
            snack: { name: 'Yogur y Avena', details: '1 Yogur Griego, 40g Avena, 15g nueces', kcal: 350, p: 15, c: 40, f: 15 },
            dinner: { name: 'Ensalada Completa', details: '80g Arroz, 1 lata atún, maíz, huevo duro, aceitunas', kcal: 600, p: 30, c: 70, f: 20 }
        }
    },
    {
        id: 'wed', name: 'Miércoles',
        meals: {
            breakfast: { name: 'Batido Energético', details: '80g Avena, 250ml Leche, 1 scoop Whey, 1 plátano, 1 cda crema cacahuete', kcal: 700, p: 40, c: 90, f: 20 },
            lunch: { name: 'Lentejas', details: '100g Lentejas (seco), patata, verduras, 120g pollo troceado', kcal: 800, p: 45, c: 100, f: 10 },
            snack: { name: 'Tortitas Arroz', details: '3 Tortitas arroz, 1 plátano, Batido Whey', kcal: 350, p: 25, c: 50, f: 2 },
            dinner: { name: 'Salmón y Boniato', details: '300g Boniato horno, 150g Salmón plancha, Espárragos', kcal: 650, p: 35, c: 60, f: 25 }
        }
    },
    {
        id: 'thu', name: 'Jueves',
        meals: {
            breakfast: { name: 'Porridge Choco', details: '80g Avena, leche, 15g chocolate negro, Tortilla 3 claras', kcal: 650, p: 30, c: 90, f: 15 },
            lunch: { name: 'Quinoa con Pavo', details: '120g Quinoa, 140g Pavo plancha, Brócoli, 10g Aceite', kcal: 750, p: 40, c: 100, f: 15 },
            snack: { name: 'Merienda Ligera', details: 'Sándwich pavo y queso light, 1 Pera', kcal: 350, p: 20, c: 50, f: 5 },
            dinner: { name: 'Revuelto Gambas', details: '3 Huevos revueltos, 150g gambas, ajetes, 200g patata cocida', kcal: 600, p: 40, c: 40, f: 20 }
        }
    },
    {
        id: 'fri', name: 'Viernes',
        meals: {
            breakfast: { name: 'Tortitas', details: '80g harina avena, 2 huevos, leche, miel', kcal: 650, p: 25, c: 90, f: 15 },
            lunch: { name: 'Pollo al Curry', details: '120g Arroz Basmati, 140g Muslo pollo deshuesado, Calabacín', kcal: 800, p: 35, c: 110, f: 20 },
            snack: { name: 'Yogur Proteico', details: '1 Yogur proteico/griego, 40g Granola, Fruta', kcal: 350, p: 20, c: 50, f: 5 },
            dinner: { name: 'Pizza Casera', details: 'Base integral/wrap, tomate, 120g pollo, mozzarella light, orégano', kcal: 700, p: 40, c: 70, f: 25 }
        }
    },
    {
        id: 'weekend', name: 'Fin de Semana',
        meals: {
            breakfast: { name: 'Flexible', details: 'Mantener estructura de proteínas y avena/huevos', kcal: 600, p: 30, c: 80, f: 15 },
            lunch: { name: 'Comida Libre', details: 'Disfruta de una comida fuera de la dieta (Sábado).', kcal: 1000, p: 40, c: 100, f: 40 },
            snack: { name: 'Fruta', details: 'Pieza de fruta y batido si es necesario', kcal: 300, p: 20, c: 40, f: 5 },
            dinner: { name: 'Ligera', details: 'Ensalada completa con proteína (atún/pollo)', kcal: 500, p: 30, c: 20, f: 15 }
        },
        note: 'Domingo: Día de Meal Prep. Cocina las bases (arroz, pollo) para la semana.'
    }
];

// Confirm Modal Component
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 animate-slide-up border border-white/60">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-amber-100 text-amber-500 p-2 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">{title}</h3>
                </div>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">{description}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Component for Editing
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meal: Meal) => void;
    meal: Meal;
    title: string;
}

const EditMealModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, meal, title }) => {
    const [formData, setFormData] = useState<Meal>(meal);

    useEffect(() => {
        setFormData(meal);
    }, [meal, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-white">
                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-xl tracking-tight">Editar {title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Nombre del plato</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-brand outline-none shadow-inner-soft text-lg"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Ingredientes / Detalles</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium focus:ring-2 focus:ring-brand outline-none h-28 resize-none shadow-inner-soft"
                            value={formData.details}
                            onChange={(e) => setFormData({...formData, details: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-2 text-center">Kcal</label>
                            <input 
                                type="number" 
                                className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-slate-800 shadow-inner-soft"
                                value={formData.kcal}
                                onChange={(e) => setFormData({...formData, kcal: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold text-blue-500 uppercase mb-2 text-center">Prot</label>
                            <input 
                                type="number" 
                                className="w-full text-center bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 font-black text-blue-700"
                                value={formData.p}
                                onChange={(e) => setFormData({...formData, p: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold text-emerald-500 uppercase mb-2 text-center">Carb</label>
                            <input 
                                type="number" 
                                className="w-full text-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 font-black text-emerald-700"
                                value={formData.c}
                                onChange={(e) => setFormData({...formData, c: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold text-amber-500 uppercase mb-2 text-center">Grasa</label>
                            <input 
                                type="number" 
                                className="w-full text-center bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 font-black text-amber-700"
                                value={formData.f}
                                onChange={(e) => setFormData({...formData, f: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="px-8 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 hover:bg-brandDark hover:scale-105 transition-all flex items-center gap-2">
                        <Save size={18}/> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DietPlan: React.FC = () => {
    const [dietData, setDietData] = useState<DayPlan[]>([]);
    const [expandedDay, setExpandedDay] = useState<string | null>('mon');
    const [showShoppingList, setShowShoppingList] = useState(false);
    
    // Reset Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // Editing State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editingMealType, setEditingMealType] = useState<string | null>(null);
    const [editingMealData, setEditingMealData] = useState<Meal | null>(null);

    // Shopping List State
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Load from LocalStorage or use Default
        const savedDiet = localStorage.getItem('user_diet_plan');
        if (savedDiet) {
            setDietData(JSON.parse(savedDiet));
        } else {
            // IMPORTANT: Use Deep Copy to prevent reference bugs
            setDietData(JSON.parse(JSON.stringify(defaultDietData)));
        }

        const savedShoppingList = localStorage.getItem('shopping_list_checked');
        if (savedShoppingList) {
            setCheckedItems(JSON.parse(savedShoppingList));
        }
    }, []);

    const saveDiet = (newData: DayPlan[]) => {
        setDietData(newData);
        localStorage.setItem('user_diet_plan', JSON.stringify(newData));
    };

    const handleResetClick = () => {
        setIsResetModalOpen(true);
    };

    const executeReset = () => {
        // 1. Remove from storage
        localStorage.removeItem('user_diet_plan');
        
        // 2. Create fresh Deep Copy of defaults
        const resetData = JSON.parse(JSON.stringify(defaultDietData));
        
        // 3. Update state
        setDietData(resetData);
        
        // 4. Persist
        localStorage.setItem('user_diet_plan', JSON.stringify(resetData));
        
        // 5. Close modal
        setIsResetModalOpen(false);
    };

    const toggleDay = (id: string) => setExpandedDay(expandedDay === id ? null : id);

    const handleEditClick = (dayId: string, mealType: string, meal: Meal) => {
        setEditingDayId(dayId);
        setEditingMealType(mealType);
        setEditingMealData(meal);
        setIsEditModalOpen(true);
    };

    const handleSaveMeal = (updatedMeal: Meal) => {
        if (!editingDayId || !editingMealType) return;

        const newData = dietData.map(day => {
            if (day.id === editingDayId) {
                return {
                    ...day,
                    meals: {
                        ...day.meals,
                        [editingMealType]: updatedMeal
                    }
                };
            }
            return day;
        });

        saveDiet(newData);
        setIsEditModalOpen(false);
    };

    const toggleShoppingItem = (item: string) => {
        const newChecked = { ...checkedItems, [item]: !checkedItems[item] };
        setCheckedItems(newChecked);
        localStorage.setItem('shopping_list_checked', JSON.stringify(newChecked));
    };

    // Generate simple list based on text analysis (simplified)
    const shoppingList = [
        "Avena (1kg)", "Leche Entera (2L)", "Proteína Whey", "Huevos (Docena)", 
        "Plátanos (1 racimo)", "Manzanas/Peras/Naranjas", 
        "Arroz Blanco/Basmati (1kg)", "Pasta Integral", "Quinoa", "Lentejas", 
        "Patatas/Boniatos (2kg)", "Pan Integral", "Tortitas Arroz", 
        "Pechuga Pollo (1kg)", "Carne Picada Magra (300g)", "Pavo (fiambre)", 
        "Merluza/Bacalao congelado", "Salmón", "Latas Atún", 
        "Aceite Oliva Virgen", "Nueces/Crema Cacahuete", "Yogur Griego"
    ];

    return (
        <div className="pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Plan Nutricional</h2>
                    <p className="text-slate-500 font-medium mt-1">Diseña tu éxito semana a semana.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleResetClick}
                        className="text-xs text-slate-400 underline hover:text-red-500 font-bold px-3"
                    >
                        Resetear
                    </button>
                    <button 
                        onClick={() => setShowShoppingList(!showShoppingList)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm border ${
                            showShoppingList 
                            ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                            : 'bg-white border-white text-slate-700 hover:bg-slate-50 hover:shadow-md'
                        }`}
                    >
                        {showShoppingList ? <Utensils size={18} /> : <ShoppingCart size={18} />}
                        {showShoppingList ? 'Ver Plan' : 'Lista Compra'}
                    </button>
                </div>
            </div>

            {showShoppingList ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-card border border-white p-8 animate-slide-up">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-800">Básicos del Supermercado</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase">Basado en tu plan actual</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shoppingList.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => toggleShoppingItem(item)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                                    checkedItems[item] 
                                    ? 'bg-emerald-50/50 border-emerald-100 shadow-inner' 
                                    : 'bg-white border-slate-100 hover:border-brand/30 hover:shadow-md'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                    checkedItems[item] 
                                    ? 'bg-emerald-500 border-emerald-500 scale-110' 
                                    : 'border-slate-200 bg-white group-hover:border-brand'
                                }`}>
                                    {checkedItems[item] && <Check size={14} className="text-white stroke-[4]" />}
                                </div>
                                <span className={`font-bold text-sm transition-all ${
                                    checkedItems[item] ? 'text-emerald-700/60 line-through' : 'text-slate-700 group-hover:text-brand'
                                }`}>{item}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {dietData.map((day, index) => (
                        <div 
                            key={day.id} 
                            className={`bg-white rounded-[1.5rem] shadow-card border border-white overflow-hidden transition-all duration-500 ${
                                expandedDay === day.id ? 'ring-4 ring-brand/5 shadow-card-hover' : 'hover:shadow-md'
                            } animate-slide-up`} 
                            style={{animationDelay: `${index * 0.08}s`}}
                        >
                            <button 
                                onClick={() => toggleDay(day.id)}
                                className={`w-full flex justify-between items-center p-6 text-left transition-colors ${expandedDay === day.id ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${
                                        expandedDay === day.id ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {day.name.charAt(0)}
                                    </div>
                                    <span className={`font-black text-xl ${expandedDay === day.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {day.name}
                                    </span>
                                </div>
                                {expandedDay === day.id ? <ChevronUp className="text-brand" strokeWidth={3}/> : <ChevronDown className="text-slate-300" strokeWidth={3}/>}
                            </button>
                            
                            {expandedDay === day.id && (
                                <div className="p-6 space-y-8 bg-white/50">
                                    {day.note && (
                                        <div className="bg-blue-50/50 text-blue-800 p-4 rounded-2xl text-sm flex items-start gap-3 border border-blue-100/50 shadow-sm animate-fade-in">
                                            <div className="bg-blue-100 p-1 rounded-lg shrink-0"><Info size={16} /></div>
                                            <p className="font-medium mt-0.5">{day.note}</p>
                                        </div>
                                    )}
                                    
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {Object.entries(day.meals).map(([key, meal], i) => (
                                            <div key={key} className="relative group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-extrabold text-[10px] text-brand uppercase tracking-widest bg-brand/5 px-2 py-1 rounded-lg">
                                                        {key === 'breakfast' && 'Desayuno'}
                                                        {key === 'lunch' && 'Almuerzo'}
                                                        {key === 'snack' && 'Merienda'}
                                                        {key === 'dinner' && 'Cena'}
                                                    </h4>
                                                    <button 
                                                        onClick={() => handleEditClick(day.id, key, meal)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-white hover:bg-brand rounded-lg shadow-sm"
                                                        title="Editar Comida"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                </div>
                                                
                                                <p className="text-lg font-black text-slate-800 mb-2 line-clamp-1" title={meal.name}>{meal.name}</p>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 h-10 line-clamp-2">{meal.details}</p>
                                                
                                                <div className="flex items-center gap-2 text-xs pt-3 border-t border-slate-50">
                                                    <span className="bg-slate-900 text-white px-2 py-1 rounded-lg font-bold shadow-sm">{meal.kcal} kcal</span>
                                                    <div className="flex gap-2 ml-auto font-bold text-[10px] uppercase tracking-wide">
                                                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">P:{meal.p}</span>
                                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">C:{meal.c}</span>
                                                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">G:{meal.f}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingMealData && (
                <EditMealModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveMeal}
                    meal={editingMealData}
                    title={editingMealType === 'breakfast' ? 'Desayuno' : editingMealType === 'lunch' ? 'Almuerzo' : editingMealType === 'snack' ? 'Merienda' : 'Cena'}
                />
            )}

            {/* Reset Confirmation Modal */}
            <ConfirmModal 
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={executeReset}
                title="¿Reiniciar Plan?"
                description="Se perderán todas las personalizaciones de tus comidas y volverás a la dieta base predeterminada."
            />
        </div>
    );
};

export default DietPlan;