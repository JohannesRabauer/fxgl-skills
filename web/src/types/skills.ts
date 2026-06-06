export type UICategory = '2d' | '3d' | 'subsystem' | 'workflow';

export interface SkillMetadata {
  author: string;
  version: string;
  'fxgl-version': string;
}

export interface Skill {
  name: string;
  title: string;
  path: string;
  description: string;
  triggers: string[];
  compatibility: string;
  category: string;
  tags: string[];
  metadata: SkillMetadata;
}

export interface AnnotatedSkill extends Skill {
  uiCategory: UICategory;
  cardIndex: number;
}

export interface SkillGroups {
  'game-types-2d': string[];
  'game-types-3d': string[];
  workflow: string[];
}

export interface SkillIndex {
  repository: string;
  skillCount: number;
  skillGroups: SkillGroups;
  skills: Skill[];
}
