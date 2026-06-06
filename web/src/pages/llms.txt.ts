import type { APIRoute } from 'astro';
import { skills } from '../data/skills';

const RAW = 'https://raw.githubusercontent.com/JohannesRabauer/fxgl-skills/main/skills';

export const GET: APIRoute = () => {
  const lines = [
    '# FXGL Skills',
    '',
    '> Canonical, tool-agnostic coding skills for AI-assisted FXGL game development (Java 17+, FXGL 21.x).',
    '> Compatible with Claude Code, GitHub Copilot, and Cursor.',
    '',
    '## Skills',
    '',
    ...skills.map(s => {
      const desc = s.description.trim().replace(/\s+/g, ' ');
      return `- [${s.name}](${RAW}/${s.name}/SKILL.md): ${desc}`;
    }),
    '',
    '## Resources',
    '',
    `- [Index](${RAW}/../index.json): Full index with metadata, triggers, tags, and categories`,
    `- [Download ZIP](https://github.com/JohannesRabauer/fxgl-skills/releases/latest/download/fxgl-skills.zip): All skills as a single archive`,
    `- [npm package](https://www.npmjs.com/package/fxgl-skills): Programmatic access via Node.js`,
    `- [Website](https://johannesrabauer.github.io/fxgl-skills/): Browse and search skills`,
    `- [Repository](https://github.com/JohannesRabauer/fxgl-skills): Source on GitHub`,
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
