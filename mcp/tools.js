import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const skillsDir = resolve(__dirname, '../skills');

const index = JSON.parse(readFileSync(resolve(skillsDir, 'index.json'), 'utf-8'));
export const skills = index.skills;

export function getSkillContent(name) {
  return readFileSync(resolve(skillsDir, name, 'SKILL.md'), 'utf-8');
}

export function search(query) {
  const q = query.toLowerCase();
  return skills.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q)) ||
    s.triggers.some(t => t.toLowerCase().includes(q))
  );
}

const SKILL_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name:        { type: 'string', description: 'Unique skill identifier, e.g. "fxgl-platformer"' },
    description: { type: 'string', description: 'One-sentence summary of what the skill covers' },
    category:    { type: 'string', description: 'Hierarchical category, e.g. "fxgl/game-type/2d"' },
    tags:        { type: 'array', items: { type: 'string' }, description: 'Searchable keyword tags' },
  },
  required: ['name', 'description', 'category', 'tags'],
};

const READ_ONLY = {
  readOnlyHint:    true,
  destructiveHint: false,
  idempotentHint:  true,
  openWorldHint:   false,
};

export function createMcpServer() {
  const server = new Server(
    { name: 'FXGL Skills', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_skills',
        description:
          'List all available FXGL coding skills with their name, description, category, and ' +
          'tags. Returns metadata for all 50 skills covering 2D game types (platformer, RPG, ' +
          'shooter, puzzle, etc.), 3D game types (FPS, voxel, third-person), and engine ' +
          'subsystems (physics, AI pathfinding, animation, audio, input, UI, save/load). ' +
          'Call this first to discover which skills exist before calling get_skill.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        outputSchema: {
          type: 'array',
          description: 'Array of skill metadata objects, one per available skill.',
          items: SKILL_ITEM_SCHEMA,
        },
        annotations: READ_ONLY,
      },
      {
        name: 'get_skill',
        description:
          'Retrieve the full implementation guidance for a single FXGL skill by its exact ' +
          'name. Returns the complete SKILL.md file, which includes YAML front matter ' +
          '(triggers, compatibility, tags, allowed tools) followed by detailed Markdown ' +
          'guidance with FXGL API references, step-by-step patterns, and Java code examples ' +
          'targeting Java 17+ and FXGL 21.x. Use list_skills or search_skills first if you ' +
          'are unsure of the exact skill name.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'Exact skill identifier as returned by list_skills or search_skills. ' +
                'Always lowercase with hyphens, e.g. "fxgl-platformer", ' +
                '"fxgl-ai-pathfinding", "fxgl-physics-collision".',
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
        outputSchema: {
          type: 'string',
          description:
            'Complete SKILL.md content in Markdown format. Begins with a YAML front matter ' +
            'block (---) containing machine-readable metadata, followed by structured ' +
            'implementation guidance, FXGL API usage, and Java code snippets.',
        },
        annotations: READ_ONLY,
      },
      {
        name: 'search_skills',
        description:
          'Search across all 50 FXGL skills by keyword or phrase. Matches against skill ' +
          'names, descriptions, categories, tags, and trigger phrases. Returns all matching ' +
          'skills with their name, description, category, tags, and triggers. Use this when ' +
          'you know what you want to build but are not sure which skill covers it — for ' +
          'example, query "jump" to find platformer and physics skills, "enemy" to find AI ' +
          'and pathfinding skills, or "save" to find persistence skills.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Keyword or short phrase to match against skill names, descriptions, tags, ' +
                'categories, and trigger phrases. Examples: "collision", "pathfinding", ' +
                '"multiplayer", "side-scrolling platformer", "procedural generation".',
            },
          },
          required: ['query'],
          additionalProperties: false,
        },
        outputSchema: {
          type: 'array',
          description: 'Array of matching skill metadata objects, each including triggers.',
          items: {
            ...SKILL_ITEM_SCHEMA,
            properties: {
              ...SKILL_ITEM_SCHEMA.properties,
              triggers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Natural-language phrases that should activate this skill',
              },
            },
            required: [...SKILL_ITEM_SCHEMA.required, 'triggers'],
          },
        },
        annotations: READ_ONLY,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'list_skills') {
      const rows = skills.map(s => ({
        name: s.name,
        description: s.description.trim().replace(/\s+/g, ' '),
        category: s.category,
        tags: s.tags,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    }

    if (name === 'get_skill') {
      const skill = skills.find(s => s.name === args.name);
      if (!skill) {
        return {
          content: [{ type: 'text', text: `No skill named "${args.name}". Use list_skills to see all available names.` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: getSkillContent(skill.name) }] };
    }

    if (name === 'search_skills') {
      const hits = search(args.query);
      if (hits.length === 0) {
        return { content: [{ type: 'text', text: `No skills matched "${args.query}". Try a broader term or call list_skills to see all skills.` }] };
      }
      const rows = hits.map(s => ({
        name: s.name,
        description: s.description.trim().replace(/\s+/g, ' '),
        category: s.category,
        tags: s.tags,
        triggers: s.triggers,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });

  return server;
}
