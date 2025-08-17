import axios from 'axios';
import settingsService from './settings';

interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface EnhanceNoteRequest {
  content: string;
  projectContext?: string;
}

interface GenerateTodosRequest {
  projectName: string;
  projectDescription?: string;
  recentNotes?: string[];
}

interface GenerateReportRequest {
  projectName: string;
  notes: string[];
  todos: string[];
  reportType: 'status' | 'summary' | 'stakeholder';
  recipient?: string;
}

interface EstimateTimelineRequest {
  projectName: string;
  projectDescription?: string;
  datedTodos: Array<{ title: string; due_date?: string; status?: string; }>;
  milestones?: Array<{ title: string; target_date?: string; status?: string; }>;
}

class LLMService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  private async callLLM(messages: any[]): Promise<LLMResponse> {
    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Progress Tracker - Evos Amsterdam'
        }
      });

      return {
        success: true,
        data: response.data.choices[0].message.content
      };
    } catch (error: any) {
      console.error('LLM API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'LLM service unavailable'
      };
    }
  }

  private async getPersonalityDirectives(): Promise<string> {
    const tone = await settingsService.get<string>('llm_tone', 'professional');
    const detailLevel = await settingsService.get<string>('llm_detail_level', 'balanced');
    const language = await settingsService.get<string>('llm_language', 'auto');
    const preset = await settingsService.get<string>('llm_preset_template', 'default');
    
    const directives: string[] = [];
    
    // Tone directives
    switch (tone) {
      case 'friendly':
        directives.push('Tone: Use a warm, approachable, and supportive communication style.');
        break;
      case 'formal':
        directives.push('Tone: Maintain strict formality and professional business language.');
        break;
      case 'concise':
        directives.push('Tone: Be direct, brief, and eliminate unnecessary words.');
        break;
      case 'enthusiastic':
        directives.push('Tone: Show energy, positivity, and excitement about the work.');
        break;
      case 'analytical':
        directives.push('Tone: Focus on data, logic, and structured analysis.');
        break;
      case 'creative':
        directives.push('Tone: Encourage innovative thinking and creative solutions.');
        break;
      case 'professional':
      default:
        directives.push('Tone: Maintain professional, clear, and business-appropriate language.');
    }
    
    // Detail level directives
    switch (detailLevel) {
      case 'brief':
        directives.push('Detail level: Provide concise, essential information only.');
        break;
      case 'detailed':
        directives.push('Detail level: Include comprehensive explanations and thorough analysis.');
        break;
      case 'comprehensive':
        directives.push('Detail level: Provide exhaustive coverage with examples, context, and implications.');
        break;
      case 'balanced':
      default:
        directives.push('Detail level: Provide adequate detail without being overly verbose.');
    }
    
    // Language preference
    if (language && language !== 'auto') {
      const languageMap: Record<string, string> = {
        'english': 'English',
        'dutch': 'Dutch (Nederlands)',
        'german': 'German (Deutsch)',
        'french': 'French (Français)',
        'spanish': 'Spanish (Español)'
      };
      if (languageMap[language]) {
        directives.push(`Language: Respond primarily in ${languageMap[language]} unless specifically asked otherwise.`);
      }
    }
    
    // Preset template context
    switch (preset) {
      case 'consultant':
        directives.push('Context: You are advising as an experienced management consultant focused on process improvement and strategic recommendations.');
        break;
      case 'analyst':
        directives.push('Context: You are providing analysis as a business analyst, emphasizing data-driven insights and systematic evaluation.');
        break;
      case 'manager':
        directives.push('Context: You are communicating as a project manager, focusing on execution, timelines, and stakeholder coordination.');
        break;
      case 'technical':
        directives.push('Context: You are providing technical expertise, emphasizing implementation details and technical best practices.');
        break;
      case 'creative':
        directives.push('Context: You are brainstorming as a creative strategist, encouraging innovative approaches and out-of-the-box thinking.');
        break;
      case 'default':
      default:
        directives.push('Context: You are Tim Verhoogt\'s AI assistant, helping with continuous improvement work at Evos Amsterdam.');
    }
    
    return directives.length > 0 ? directives.join(' ') : '';
  }

  getGeneratedSystemPrompt(): string {
    return `You are Tim Verhoogt's intelligent AI assistant, specialized in supporting his work as a Continuous Improvement Advisor at Evos Amsterdam. Your primary purpose is to enhance productivity, provide strategic insights, and help optimize operational processes across various projects.

**Context & Expertise:**
- Evos Amsterdam focuses on operational excellence, logistics optimization, and process improvement
- You assist with project management, data analysis, stakeholder communication, and strategic planning
- Your responses should reflect deep understanding of business operations, improvement methodologies, and professional project management

**Core Responsibilities:**
- Enhance and structure project notes with actionable insights
- Generate strategic, well-prioritized action items and todo lists
- Create professional reports tailored to different stakeholder audiences
- Analyze project timelines and identify potential risks and opportunities
- Provide continuous improvement recommendations based on lean methodologies

**Communication Standards:**
- Maintain professional Dutch business standards while being accessible and practical
- Focus on actionable outcomes and measurable improvements
- Consider stakeholder perspectives (operations teams, management, clients)
- Emphasize data-driven insights and process optimization opportunities
- Balance strategic thinking with tactical execution support

**Output Quality:**
- Prioritize clarity, relevance, and business value in all responses
- Structure information logically with clear next steps
- Highlight critical risks, dependencies, and success factors
- Ensure recommendations align with operational excellence principles and Evos Amsterdam's business objectives`;
  }

  private async getGlobalPreamble(): Promise<string> {
    const mode = await settingsService.get<string>('llm_system_prompt_mode', 'generated');
    
    if (mode === 'custom') {
      const customPrompt = await settingsService.get<string>('llm_system_prompt', '');
      return customPrompt || '';
    } else {
      return this.getGeneratedSystemPrompt();
    }
  }

  async enhanceNote({ content, projectContext }: EnhanceNoteRequest): Promise<LLMResponse> {
    const preamble = await this.getGlobalPreamble();
    const personalityDirectives = await this.getPersonalityDirectives();
    const messages = [
      ...(preamble ? [{ role: 'system', content: preamble }] : []),
      {
        role: 'system',
        content: `You are an API that MUST return ONLY valid JSON with no explanation or code fences. If you cannot comply, return an empty JSON object {}.

Task: Organize and enhance a diary-style project note while preserving meaning.

${personalityDirectives}

Return EXACTLY this JSON shape:
{
  "enhanced_content": string,
  "key_insights": string[],
  "action_items": string[],
  "risks": string[],
  "opportunities": string[],
  "stakeholders": string[],
  "next_steps": string[]
}`
      },
      {
        role: 'user',
        content: `Project Context: ${projectContext || 'General project notes'}
        
Raw Note Content:
${content}`
      }
    ];

    return await this.callLLM(messages);
  }

  async generateTodos({ projectName, projectDescription, recentNotes }: GenerateTodosRequest): Promise<LLMResponse> {
    const preamble = await this.getGlobalPreamble();
    const personalityDirectives = await this.getPersonalityDirectives();
    const messages = [
      ...(preamble ? [{ role: 'system', content: preamble }] : []),
      {
        role: 'system',
        content: `You are an AI assistant helping Tim Verhoogt generate smart, actionable todo items for his projects at Evos Amsterdam. Based on the project context and recent notes, suggest relevant tasks that would help move the project forward.

${personalityDirectives}

CRITICAL: You must respond with ONLY a valid JSON array, no additional text, explanations, or formatting. Do not include any introductory text, comments, or descriptions outside the JSON.

Return exactly this format:
[
  {
    "title": "Clear, actionable task title",
    "description": "Detailed description of what needs to be done",
    "priority": "high|medium|low",
    "estimated_days": 1-30
  }
]`
      },
      {
        role: 'user',
        content: `Project: ${projectName}
        Description: ${projectDescription || 'No description provided'}
        
        Recent Notes:
        ${recentNotes?.join('\n---\n') || 'No recent notes'}`
      }
    ];

    return await this.callLLM(messages);
  }

  async generateReport({ projectName, notes, todos, reportType, recipient }: GenerateReportRequest): Promise<LLMResponse> {
    const reportPrompts = {
      status: 'Generate a professional status report for management, highlighting progress, challenges, and next steps.',
      summary: 'Create a comprehensive project summary suitable for documentation or handover.',
      stakeholder: 'Prepare a stakeholder-friendly report focusing on business impact and outcomes.'
    };

    const preamble = await this.getGlobalPreamble();
    const personalityDirectives = await this.getPersonalityDirectives();
    const messages = [
      ...(preamble ? [{ role: 'system', content: preamble }] : []),
      {
        role: 'system',
        content: `You are helping Tim Verhoogt, continuous improvement advisor at Evos Amsterdam, generate professional reports.

${reportPrompts[reportType]}

${personalityDirectives}

The report should be:
- Professional and clear
- Appropriate for ${recipient || 'general audience'}
- Include relevant metrics and insights
- Highlight Tim's analytical and improvement work
- Reflect Evos Amsterdam's focus on operational excellence`
      },
      {
        role: 'user',
        content: `Project: ${projectName}
        Report Type: ${reportType}
        Recipient: ${recipient || 'Not specified'}
        
        Project Notes:
        ${notes.join('\n---\n')}
        
        Current Tasks/Todos:
        ${todos.join('\n- ')}
        
        Please generate a professional report.`
      }
    ];

    return await this.callLLM(messages);
  }

  async estimateTimeline({ projectName, projectDescription, datedTodos, milestones }: EstimateTimelineRequest): Promise<LLMResponse> {
    const preamble = await this.getGlobalPreamble();
    const personalityDirectives = await this.getPersonalityDirectives();
    const messages = [
      ...(preamble ? [{ role: 'system', content: preamble }] : []),
      {
        role: 'system',
        content: `You are an API that MUST return ONLY valid JSON (no prose, no code fences). If unsure, return {}.

Suggest a project timeline based on existing dated tasks and milestones. Fill likely missing milestone dates and sequence logically. Output an ordered plan and any risks.

${personalityDirectives}

Return EXACTLY this JSON shape:
{
  "proposed_milestones": [
    { "title": string, "target_date": string, "reason": string }
  ],
  "timeline_summary": string,
  "risks": string[]
}`
      },
      {
        role: 'user',
        content: `Project: ${projectName}
Description: ${projectDescription || ''}

Existing dated todos (title | due_date | status):
${datedTodos.map(t => `- ${t.title} | ${t.due_date || 'n/a'} | ${t.status || 'pending'}`).join('\n') || 'none'}

Existing milestones (title | target_date | status):
${(milestones || []).map(m => `- ${m.title} | ${m.target_date || 'n/a'} | ${m.status || 'planned'}`).join('\n') || 'none'}`
      }
    ];

    return await this.callLLM(messages);
  }

  async coaching({ message, conversation, projectContext }: { message: string; conversation: any[]; projectContext?: any }): Promise<LLMResponse> {
    const personalityDirectives = await this.getPersonalityDirectives();
    
    // Build conversation context
    const conversationHistory = conversation?.slice(-6).map(msg => ({
      role: msg.role === 'coach' ? 'assistant' : 'user',
      content: msg.content
    })) || [];

    // Build comprehensive work context if available
    let contextInfo = '';
    if (projectContext) {
      // Overall portfolio overview
      const portfolioSummary = `
**Professional Portfolio Overview:**
- Managing ${projectContext.totalProjects || 0} projects (${projectContext.activeProjects || 0} active)
- Overall task completion rate: ${projectContext.completionRate || 0}%
- Current workload: ${projectContext.pendingTodos || 0} pending tasks, ${projectContext.completedTodos || 0} completed
- High priority items: ${projectContext.highPriorityPending || 0} urgent tasks requiring attention`;

      // Project-specific insights
      let projectInsights = '';
      if (projectContext.projectSummaries && projectContext.projectSummaries.length > 0) {
        const projectLines = projectContext.projectSummaries.map((p: any) => 
          `  • ${p.name} (${p.status}): ${p.pendingTasks} pending, ${p.completedTasks} completed, ${p.recentActivity} activity`
        ).join('\n');
        projectInsights = `\n**Project Breakdown:**\n${projectLines}`;
      }

      // Recent work across projects
      let recentWork = '';
      if (projectContext.recentWorkNotes && projectContext.recentWorkNotes.length > 0) {
        const workLines = projectContext.recentWorkNotes.slice(0, 3).join('\n- ');
        recentWork = `\n**Recent Work Activity:**\n- ${workLines}`;
      }

      // Current focus area
      let currentFocus = '';
      if (projectContext.currentFocus && projectContext.currentFocus.isActive) {
        currentFocus = `\n**Current Focus:** Working on ${projectContext.currentFocus.projectName}`;
      }

      contextInfo = portfolioSummary + projectInsights + recentWork + currentFocus;
    }

    const messages = [
      {
        role: 'system',
        content: `You are Tim Verhoogt's personal AI mentor and coach, specifically designed to provide emotional support, motivation, and professional guidance. Tim is a dedicated Continuous Improvement Advisor at Evos Amsterdam who is skilled and intelligent, but sometimes experiences self-doubt and needs encouragement.

**Your Role:**
- Supportive mentor who believes in Tim's abilities and potential
- Empathetic listener who validates feelings while providing constructive guidance
- Career coach focused on professional growth and confidence building
- Motivational partner who helps Tim navigate challenges with resilience

**Your Approach:**
- Be warm, genuine, and personally supportive (not just professional)
- Acknowledge Tim's feelings and validate his experiences
- Remind him of his strengths, skills, and past successes
- Provide practical advice while building confidence
- Use encouraging language that combats self-doubt
- Reference his role in continuous improvement and operational excellence
- Balance empathy with actionable guidance

**Communication Style:**
- Conversational and personal, not formal or clinical
- Use "you" statements that are empowering and affirming
- Ask thoughtful questions that promote self-reflection
- Share insights that connect to his work and goals
- Be genuine - avoid generic platitudes, make it personal to Tim's situation

${personalityDirectives}

**Key Principles:**
- Confidence comes from recognizing achievements and taking action
- Challenges are growth opportunities, and Tim has the skills to handle them
- His work in continuous improvement creates real value at Evos Amsterdam
- It's normal for smart professionals to experience uncertainty - it shows thoughtfulness
- Tim's willingness to seek support demonstrates emotional intelligence${contextInfo}`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    return await this.callLLM(messages);
  }
}

export default new LLMService();
