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

export interface SkillWithContent extends Skill {
  content: string;
}

export interface SkillIndex {
  repository: string;
  skillCount: number;
  skillGroups: {
    'game-types-2d': string[];
    'game-types-3d': string[];
    workflow: string[];
  };
  skills: Skill[];
}

export declare const index: SkillIndex;
export declare const skills: Skill[];
export declare function getSkillContent(name: string): string;
export declare function getSkill(name: string): SkillWithContent | null;
