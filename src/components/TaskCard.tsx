
import React, { useState } from 'react';
import type { TaskRule } from '../types';
import { Clock, CheckCircle, PlayCircle, BookOpen, Music, RotateCcw, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  task: TaskRule;
  todayTransactions: Map<string, string>; // Maps taskId/subTaskId to transactionId
  onComplete: (points: number, description: string, taskId: string) => void;
  onUndo: (transactionId: string) => void;
  isEditing: boolean;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: TaskRule) => void;
}

export const TaskCard: React.FC<Props> = ({ 
  task, 
  todayTransactions, 
  onComplete, 
  onUndo,
  isEditing,
  onDelete,
  onEdit
}) => {
  const [isTimeBonusChecked, setIsTimeBonusChecked] = useState(() => {
    const hour = new Date().getHours();
    return hour < 20; // Default to true if current time is before 8 PM
  });

  // Check if main task is done (for simple, time bonus, duration tasks)
  const mainTxId = todayTransactions.get(task.id);
  const isMainTaskDone = !!mainTxId;

  const handleSimpleComplete = () => {
    if (isEditing) return; // Prevent clicking when editing
    let points = task.basePoints;
    let desc = `完成: ${task.title}`;
    
    if (task.hasTimeBonus) {
      if (isTimeBonusChecked) {
        points += (task.timeBonusPoints || 0);
        desc += ` (8点前完成 +${task.timeBonusPoints})`;
      } else {
        desc += ` (8点后完成)`;
      }
    }
    
    onComplete(points, desc, task.id);
  };

  const handleDurationComplete = (points: number, label: string) => {
    if (isEditing) return;
    onComplete(points, `完成: ${task.title} (${label})`, task.id);
  };

  const handleSubTaskComplete = (subId: string, points: number, label: string) => {
    if (isEditing) return;
    onComplete(points, `完成: ${task.title} - ${label}`, subId);
  };

  const getIcon = () => {
    if (task.title.includes('语文') || task.title.includes('阅读')) return <BookOpen className="w-5 h-5 text-blue-500" />;
    if (task.title.includes('数学') || task.title.includes('口算')) return <Clock className="w-5 h-5 text-indigo-500" />;
    if (task.title.includes('钢琴')) return <Music className="w-5 h-5 text-purple-500" />;
    if (task.title.includes('视频') || task.title.includes('RAZ') || task.title.includes('泉灵')) return <PlayCircle className="w-5 h-5 text-orange-500" />;
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  };

  // If in edit mode, click opens edit, delete shows up
  if (isEditing) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative group h-full"
      >
        {/* Delete Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(task.id); }}
          className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1.5 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-colors z-10"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Edit Overlay Click */}
        <div 
          onClick={() => onEdit?.(task)}
          className="absolute inset-0 z-0 cursor-pointer rounded-xl border-2 border-transparent hover:border-blue-300 transition-colors"
        />

        <div className="flex items-center justify-between mb-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 grayscale opacity-70">
              {getIcon()}
            </div>
            <h3 className="font-bold text-slate-700">{task.title}</h3>
          </div>
          <Edit2 className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex gap-2 mt-4 pointer-events-none opacity-60">
           <div className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500">
              基础: {task.basePoints}分
           </div>
           {task.hasTimeBonus && <div className="bg-amber-50 px-2 py-1 rounded text-xs text-amber-600">限时奖励</div>}
           {task.subTasks && <div className="bg-purple-50 px-2 py-1 rounded text-xs text-purple-600">含子任务</div>}
        </div>
      </motion.div>
    )
  }

  // Reusable overlay for completed state
  const renderCompletedState = (transactionId: string) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-2 bg-emerald-50 rounded-lg border border-emerald-100 h-full"
    >
      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
        <CheckCircle className="w-5 h-5" />
        <span>今日已完成</span>
      </div>
      <button 
        onClick={() => onUndo(transactionId)}
        className="flex items-center gap-1 px-3 py-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        <span>撤销</span>
      </button>
    </motion.div>
  );

  return (
    <motion.div 
      whileHover={isMainTaskDone ? undefined : { scale: 1.02 }}
      className={`bg-white rounded-xl p-4 shadow-sm border flex flex-col justify-between h-full transition-all ${isMainTaskDone ? 'border-emerald-100 bg-slate-50/50' : 'border-slate-100 hover:shadow-md'}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${isMainTaskDone ? 'bg-emerald-100' : 'bg-slate-50'}`}>
            {getIcon()}
          </div>
          <h3 className={`font-bold ${isMainTaskDone ? 'text-emerald-800' : 'text-slate-800'}`}>{task.title}</h3>
        </div>
        
        <p className="text-xs text-slate-500 mb-4 min-h-[2.5rem]">
          {task.description || (task.subTasks ? '分项任务' : (task.isDurationBased ? '根据时长奖励' : '完成任务获得奖励'))}
        </p>
      </div>

      <div className="mt-auto space-y-2">
        {/* State: Main Task Completed */}
        {isMainTaskDone && mainTxId ? (
          renderCompletedState(mainTxId)
        ) : (
          <>
            {/* Scenario 1: Time Bonus Task */}
            {task.hasTimeBonus && (
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none p-1 hover:bg-slate-50 rounded">
                  <input 
                    type="checkbox" 
                    checked={isTimeBonusChecked} 
                    onChange={(e) => setIsTimeBonusChecked(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span>8点前完成?</span>
                </label>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSimpleComplete}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  打卡 (+{isTimeBonusChecked ? task.basePoints + (task.timeBonusPoints || 0) : task.basePoints})
                </motion.button>
              </div>
            )}

            {/* Scenario 2: Duration Based (Piano) */}
            {task.isDurationBased && task.durationOptions && (
              <div className="grid grid-cols-1 gap-2">
                {task.durationOptions.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDurationComplete(opt.points, opt.label)}
                    className="w-full py-1.5 px-3 text-xs font-medium border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex justify-between items-center"
                  >
                    <span>{opt.label}</span>
                    <span className="font-bold">+{opt.points}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Scenario 3: Subtasks (RAZ/Quanling) */}
            {task.subTasks && (
              <div className="grid grid-cols-2 gap-2">
                {task.subTasks.map((sub) => {
                  const subTxId = todayTransactions.get(sub.id);
                  const isSubDone = !!subTxId;

                  return isSubDone ? (
                    <div key={sub.id} className="relative group">
                       <button
                        className="w-full py-2 px-2 text-xs font-medium border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg flex flex-col items-center justify-center text-center opacity-70 cursor-default"
                      >
                        <span className="mb-0.5 line-through">{sub.label}</span>
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => subTxId && onUndo(subTxId)}
                        className="absolute -top-1 -right-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-red-500"
                      >
                         <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      key={sub.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubTaskComplete(sub.id, sub.points, sub.label)}
                      className="py-2 px-2 text-xs font-medium border border-orange-200 text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center justify-center text-center"
                    >
                      <span className="mb-0.5">{sub.label}</span>
                      <span className="font-bold">+{sub.points}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Scenario 4: Simple Task */}
            {!task.hasTimeBonus && !task.isDurationBased && !task.subTasks && (
               <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={handleSimpleComplete}
               className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-blue-200 shadow-sm"
             >
               打卡 (+{task.basePoints})
             </motion.button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
