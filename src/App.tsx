
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  History, 
  ShoppingBag, 
  Trash2,
  Star,
  TrendingUp,
  CheckCircle as CheckCircleIcon,
  Settings,
  Plus,
  X,
  RotateCcw,
  Download,
  Upload,
  Cloud,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import confetti from 'canvas-confetti';

import { TASK_RULES, STORAGE_KEY } from './constants';
import { RewardType, TaskCategory } from './types';
import type { Transaction, AppState, TaskRule, AppDataExport } from './types';
import { TaskCard } from './components/TaskCard';
import { AnimatedCounter } from './components/AnimatedCounter';

const INITIAL_STATE: AppState = {
  points: 0,
  transactions: [],
  tasks: TASK_RULES, // Default to constant rules
};

function App() {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: If user has old data without tasks, inject defaults
      if (!parsed.tasks || parsed.tasks.length === 0) {
        return { ...parsed, tasks: TASK_RULES };
      }
      return parsed;
    }
    return INITIAL_STATE;
  });
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'history' | 'redeem' | 'stats'>('tasks');
  const [isEditing, setIsEditing] = useState(false); // Global Edit Mode
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false); // Data Mgmt Modal
  const [editingTask, setEditingTask] = useState<TaskRule | null>(null); // Null = Creating new
  const [modalCategory, setModalCategory] = useState<TaskCategory>(TaskCategory.SCHOOL); // Default category for new task

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inputs for Redeem
  const [toyName, setToyName] = useState('');
  const [toyPrice, setToyPrice] = useState('');

  // Inputs for Task Form
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormPoints, setTaskFormPoints] = useState(3);
  const [taskFormDesc, setTaskFormDesc] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Derived state: Map of Task ID -> Transaction ID for today's completed tasks
  const todayTransactionMap = useMemo(() => {
    const map = new Map<string, string>();
    const todayStr = new Date().toDateString();
    
    state.transactions.forEach(tx => {
      // Only care about EARN transactions that have a taskId and date is today
      if (tx.type === RewardType.EARN && tx.taskId && new Date(tx.date).toDateString() === todayStr) {
        map.set(tx.taskId, tx.id);
      }
    });
    return map;
  }, [state.transactions]);
  
  // --- Logic ---

  const handleAddPoints = (amount: number, description: string, taskId?: string) => {
    if (isEditing) return; 

    // Prevent double submission if valid taskId provided
    if (taskId && todayTransactionMap.has(taskId)) {
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      taskId: taskId,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      amount: amount,
      description,
      type: RewardType.EARN,
    };

    setState(prev => ({
      ...prev,
      points: prev.points + amount,
      transactions: [newTransaction, ...prev.transactions]
    }));

    if (amount >= 5) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#fbbf24', '#10b981']
      });
    }
  };

  const handleRedeem = () => {
    const cost = parseInt(toyPrice);
    if (!toyName || isNaN(cost) || cost <= 0) return;
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      amount: -cost,
      description: `兑换: ${toyName}`,
      type: RewardType.SPEND,
    };

    setState(prev => ({
      ...prev,
      points: prev.points - cost,
      transactions: [newTransaction, ...prev.transactions]
    }));

    setToyName('');
    setToyPrice('');
    setActiveTab('tasks');
  };

  const handleUndo = (transactionId: string) => {
    const tx = state.transactions.find(t => t.id === transactionId);
    if (!tx) return;

    setState(prev => ({
      ...prev,
      points: prev.points - tx.amount, // Reverse the amount
      transactions: prev.transactions.filter(t => t.id !== transactionId)
    }));
  };

  // --- Data Management Logic (Export/Import) ---

  const handleExportData = () => {
    const data: AppDataExport = {
      ...state,
      version: '1.0',
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `star_achiever_backup_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        // Basic Validation
        if (typeof data.points !== 'number' || !Array.isArray(data.transactions)) {
          throw new Error('Invalid format');
        }

        if (confirm(`准备导入备份数据。\n备份时间: ${data.exportDate ? new Date(data.exportDate).toLocaleString() : '未知'}\n\n⚠️ 注意：当前的所有数据将被覆盖！确定继续吗？`)) {
          const newState: AppState = {
            points: data.points,
            transactions: data.transactions,
            tasks: data.tasks || TASK_RULES // Fallback
          };
          setState(newState);
          alert('数据恢复成功！');
          setIsDataModalOpen(false);
          setIsEditing(false);
        }
      } catch (err) {
        alert('导入失败：文件格式不正确或已损坏。');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('⚠️ 严重警告 ⚠️\n\n此操作将彻底清空所有积分、记录和自定义任务，且无法撤销！\n\n确定要重新开始吗？')) {
      if (confirm('再次确认：真的要清空所有数据吗？')) {
        setState(INITIAL_STATE);
        setIsDataModalOpen(false);
        setIsEditing(false);
      }
    }
  };

  // --- Task Management Logic ---

  const openCreateModal = (category: TaskCategory) => {
    setEditingTask(null);
    setModalCategory(category);
    setTaskFormTitle('');
    setTaskFormPoints(3);
    setTaskFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskRule) => {
    setEditingTask(task);
    setModalCategory(task.category);
    setTaskFormTitle(task.title);
    setTaskFormPoints(task.basePoints);
    setTaskFormDesc(task.description || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskFormTitle.trim()) return;

    if (editingTask) {
      // Update existing
      const updatedTasks = state.tasks.map(t => 
        t.id === editingTask.id 
          ? { ...t, title: taskFormTitle, basePoints: taskFormPoints, description: taskFormDesc } 
          : t
      );
      setState(prev => ({ ...prev, tasks: updatedTasks }));
    } else {
      // Create new
      const newTask: TaskRule = {
        id: `custom_${Date.now()}`,
        title: taskFormTitle,
        basePoints: taskFormPoints,
        description: taskFormDesc || `完成${taskFormTitle}`,
        category: modalCategory
      };
      setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }));
    }
  };

  const handleResetTasks = () => {
    if (confirm('确定要重置为默认任务吗？\n\n这将加载代码中最新的任务列表，并覆盖您当前的自定义修改。\n\n您的积分和历史记录会被保留。')) {
      setState(prev => ({
        ...prev,
        tasks: TASK_RULES
      }));
      setIsEditing(false);
    }
  };

  // --- Computed Data for Stats ---
  const dailyData = useMemo(() => {
    const last7Days = new Map<string, number>();
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      last7Days.set(dateStr, 0);
    }

    state.transactions.forEach(tx => {
      if (tx.type === RewardType.EARN || tx.type === RewardType.BONUS) {
        const dateStr = new Date(tx.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        if (last7Days.has(dateStr)) {
          last7Days.set(dateStr, (last7Days.get(dateStr) || 0) + tx.amount);
        }
      }
    });

    return Array.from(last7Days.entries()).map(([date, points]) => ({ date, points }));
  }, [state.transactions]);

  const todayPoints = useMemo(() => {
    const todayStr = new Date().toDateString();
    return state.transactions
      .filter(t => new Date(t.date).toDateString() === todayStr && t.amount > 0)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [state.transactions]);

  // --- Render Helpers ---
  
  const renderSection = (category: TaskCategory, colorClass: string) => (
    <div className="mb-8 relative">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
          <span className={`w-1 h-6 ${colorClass} rounded-full`}></span>
          {category}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.tasks
          .filter(t => t.category === category)
          .map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={handleAddPoints} 
              todayTransactions={todayTransactionMap}
              onUndo={handleUndo}
              isEditing={isEditing}
              onDelete={handleDeleteTask}
              onEdit={openEditModal}
            />
          ))}
        
        {/* Add Button in Edit Mode */}
        {isEditing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => openCreateModal(category)}
            className="flex flex-col items-center justify-center min-h-[140px] rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-bold text-sm">添加新任务</span>
          </motion.button>
        )}
      </div>
    </div>
  );

  const renderTasks = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-24"
    >
      {renderSection(TaskCategory.SCHOOL, 'bg-blue-500')}
      {renderSection(TaskCategory.HOME, 'bg-indigo-500')}
    </motion.div>
  );

  const renderHistory = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 pb-24"
    >
      <h2 className="text-xl font-bold text-slate-800 mb-4">积分记录</h2>
      {state.transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无记录，快去完成任务吧！</p>
        </div>
      ) : (
        state.transactions.map((tx) => (
          <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">{tx.description}</p>
              <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-bold text-lg ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
              <button 
                onClick={() => handleUndo(tx.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="撤销"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );

  const renderRedeem = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mt-8"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">兑换奖励</h2>
        <p className="text-slate-500 text-sm mt-2">输入购买的物品和价格，将从积分中扣除。</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">物品名称</label>
          <input 
            type="text" 
            value={toyName}
            onChange={(e) => setToyName(e.target.value)}
            placeholder="例如：乐高玩具"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">花费积分 (金额)</label>
          <input 
            type="number" 
            value={toyPrice}
            onChange={(e) => setToyPrice(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-mono text-lg"
          />
        </div>
        
        <button 
          onClick={handleRedeem}
          disabled={!toyName || !toyPrice}
          className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all mt-4"
        >
          确认兑换
        </button>
        
        <p className="text-center text-xs text-slate-400 mt-4">
          当前余额: {state.points} 分
        </p>
      </div>
    </motion.div>
  );

  const renderStats = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold text-slate-800">近期表现</h2>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}} 
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
              {dailyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.points >= 15 ? '#10b981' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 rounded-2xl border border-orange-200 flex items-center gap-4">
        <div className="p-3 bg-white/50 rounded-full">
          <Trophy className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900">再接再厉！</h3>
          <p className="text-amber-700 text-sm">
            你今天已经获得了 <strong>{todayPoints}</strong> 积分。继续保持，如果一周内达到 150 分，将获得神秘奖励！
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg shadow-sm">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">Star<span className="text-blue-600">Achiever</span></span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
              <div className="text-xl font-bold text-blue-600 tabular-nums">
                <AnimatedCounter value={state.points} />
              </div>
            </div>
            
            {/* Settings Toggle */}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-600 shadow-md overflow-hidden"
          >
            <div className="py-3 px-4 text-white text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
              <span>🔧 编辑模式已开启</span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsDataModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs border border-white/40 transition-colors whitespace-nowrap"
                >
                  <Cloud className="w-3 h-3" />
                  数据管理
                </button>

                <button 
                  onClick={handleResetTasks}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs border border-white/40 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置为默认任务
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'redeem' && renderRedeem()}
          {activeTab === 'stats' && renderStats()}
        </AnimatePresence>
      </main>

      {/* Data Management Modal */}
      {isDataModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                数据备份与管理
              </h3>
              <button onClick={() => setIsDataModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Export Section */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Download className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">导出备份 (Export)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    将当前所有积分、记录和任务保存为文件。即使清除浏览器缓存，数据也不会丢失。
                  </p>
                  <button 
                    onClick={handleExportData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    下载备份文件
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">导入恢复 (Import)</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    选择之前的备份文件进行恢复。这会覆盖当前的进度，请谨慎操作。
                  </p>
                  <button 
                    onClick={handleImportClick}
                    className="px-4 py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    选择文件恢复
                  </button>
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={handleResetData}
                  className="flex items-center justify-center gap-2 w-full py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
                >
                  <AlertTriangle className="w-4 h-4" />
                  清空所有数据 (重置)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {editingTask ? '修改任务' : '添加新任务'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">任务名称</label>
                <input 
                  autoFocus
                  type="text" 
                  value={taskFormTitle}
                  onChange={e => setTaskFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：扫地"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">完成奖励 (积分)</label>
                <div className="flex items-center gap-4">
                   <input 
                    type="range" 
                    min="1" max="10" 
                    value={taskFormPoints}
                    onChange={e => setTaskFormPoints(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-bold text-blue-600 text-xl w-8 text-center">{taskFormPoints}</span>
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">描述 (可选)</label>
                <input 
                  type="text" 
                  value={taskFormDesc}
                  onChange={e => setTaskFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="简短描述..."
                />
              </div>

               {editingTask?.subTasks && (
                 <div className="p-3 bg-orange-50 text-orange-700 text-xs rounded-lg">
                   注意：此任务包含复杂的子任务逻辑，此处只能修改主标题和基础分。
                 </div>
               )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveTask}
                disabled={!taskFormTitle}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe-area z-40">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={<CheckCircleIcon />} 
            label="打卡" 
          />
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={<TrendingUp />} 
            label="图表" 
          />
           <NavButton 
            active={activeTab === 'redeem'} 
            onClick={() => setActiveTab('redeem')} 
            icon={<ShoppingBag />} 
            label="兑换" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History />} 
            label="记录" 
          />
        </div>
      </div>
    </div>
  );
}

// Helper Component for Navigation
const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${active ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={`w-6 h-6 mb-1 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
