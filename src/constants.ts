import { TaskCategory } from './types';
import type { TaskRule } from './types';

export const TASK_RULES: TaskRule[] = [
  // --- 学校作业 (School Tasks) ---
  {
    id: 'chinese_school',
    title: '语文',
    category: TaskCategory.SCHOOL,
    basePoints: 3,
    hasTimeBonus: true,
    timeBonusPoints: 2,
    description: '完成基础3分，8点前完成+2分'
  },
  {
    id: 'math_school',
    title: '数学',
    category: TaskCategory.SCHOOL,
    basePoints: 3,
    hasTimeBonus: true,
    timeBonusPoints: 2,
    description: '完成基础3分，8点前完成+2分'
  },
  {
    id: 'calc_school',
    title: '口算', // 如果想改名，直接修改这里，例如 "口算练习"
    category: TaskCategory.SCHOOL,
    basePoints: 3, // 如果想改分，修改这里
    hasTimeBonus: true,
    timeBonusPoints: 2,
    description: '完成基础3分，8点前完成+2分'
  },
  {
    id: 'reading_school',
    title: '阅读打卡',
    category: TaskCategory.SCHOOL,
    basePoints: 5,
    description: '阅读书籍超过30分钟',
  },
  
  // --- 家庭作业 & 生活习惯 (Home Tasks) ---
  {
    id: 'english_home',
    title: '英语打卡',
    category: TaskCategory.HOME,
    basePoints: 3,
  },
  {
    id: 'writing_home',
    title: '写字',
    category: TaskCategory.HOME,
    basePoints: 3,
  },
  {
    id: 'housework_general', // 新增：家务劳动
    title: '家务劳动',
    category: TaskCategory.HOME,
    basePoints: 2,
    description: '帮忙做家务（洗碗、扫地、倒垃圾等）'
  },
  {
    id: 'clean_room', // 新增：整理房间
    title: '整理房间',
    category: TaskCategory.HOME,
    basePoints: 3,
    description: '把书桌、玩具整理整齐'
  },
  {
    id: 'literacy_home',
    title: '5分钟语文素养',
    category: TaskCategory.HOME,
    basePoints: 3, 
  },
  {
    id: 'raz_home',
    title: '单词 / RAZ',
    category: TaskCategory.HOME,
    basePoints: 0, // 0表示由子任务决定分数
    subTasks: [
      { id: 'raz_video', label: '看视频', points: 2 },
      { id: 'raz_hw', label: '课后作业', points: 3 },
    ]
  },
  {
    id: 'xueersi_home',
    title: '学而思',
    category: TaskCategory.HOME,
    basePoints: 5,
  },
  {
    id: 'quanling_home',
    title: '泉灵语文',
    category: TaskCategory.HOME,
    basePoints: 0,
    subTasks: [
      { id: 'ql_video', label: '看视频', points: 5 },
      { id: 'ql_hw', label: '课后作业', points: 5 },
    ]
  },
  {
    id: 'piano_home',
    title: '钢琴练习',
    category: TaskCategory.HOME,
    basePoints: 0,
    isDurationBased: true,
    durationOptions: [
      { label: '<10分钟', points: 2 },
      { label: '10-20分钟', points: 4 },
      { label: '20-30分钟', points: 6 },
    ]
  }
];

export const STORAGE_KEY = 'star_achiever_data_v1';