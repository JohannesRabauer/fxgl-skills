import type { SkillIndex, AnnotatedSkill, UICategory } from '../types/skills';
import rawData from '@skills/index.json';

const data = rawData as unknown as SkillIndex;

const game2d = new Set(data.skillGroups['game-types-2d']);
const game3d = new Set(data.skillGroups['game-types-3d']);
const workflow = new Set(data.skillGroups['workflow']);

function uiCategory(name: string): UICategory {
  if (game2d.has(name)) return '2d';
  if (game3d.has(name)) return '3d';
  if (workflow.has(name)) return 'workflow';
  return 'subsystem';
}

export const skills: AnnotatedSkill[] = data.skills.map((s, i) => ({
  ...s,
  uiCategory: uiCategory(s.name),
  cardIndex: i,
}));

export const totalCount: number = data.skillCount;
