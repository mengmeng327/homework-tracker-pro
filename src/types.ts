
export const TaskCategory = {
  SCHOOL: '学校作业',
  HOME: '家庭作业',
} as const;
export type TaskCategory = typeof TaskCategory[keyof typeof TaskCategory];

export const RewardType = {
  EARN: 'EARN',
  SPEND: 'SPEND',
  BONUS: 'BONUS',
} as const;
export type RewardType = typeof RewardType[keyof typeof RewardType];

export interface TaskRule {
  id: string;
  title: string;
  category: TaskCategory;
  basePoints: number;
  description?: string;
  // Specific logic flags
  hasTimeBonus?: boolean; // For "before 8pm"
  timeBonusPoints?: number;
  isDurationBased?: boolean; // For piano/reading
  durationOptions?: { label: string; points: number }[]; 
  subTasks?: { id: string; label: string; points: number }[]; // For RAZ/Quanling (Video vs HW)
}

export interface Transaction {
  id: string;
  taskId?: string; // ID of the task or subtask associated with this transaction
  date: string; // ISO date string
  timestamp: number;
  amount: number; // Positive or negative
  description: string;
  type: RewardType;
}

export interface AppState {
  points: number;
  transactions: Transaction[];
  tasks: TaskRule[]; // We now save tasks in state
}

export interface AppDataExport extends AppState {
  version: string;
  exportDate: string;
}

export interface DailySummary {
  date: string;
  totalPoints: number;
}
