import axios from 'axios';

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

  async enhanceNote({ content, projectContext }: EnhanceNoteRequest): Promise<LLMResponse> {
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant helping Tim Verhoogt, a continuous improvement advisor at Evos Amsterdam (petrochemical storage), organize and enhance his project notes. 
        
        Your task is to:
        1. Extract key information from diary-style project notes
        2. Structure the information clearly
        3. Identify actionable items, risks, opportunities
        4. Maintain the original context and meaning
        5. Return a JSON object with the enhanced content

        Return format:
        {
          "enhanced_content": "A polished, professional version of the note",
          "key_insights": ["insight1", "insight2"],
          "action_items": ["action1", "action2"],
          "risks": ["risk1", "risk2"],
          "opportunities": ["opportunity1", "opportunity2"],
          "stakeholders": ["person1", "person2"],
          "next_steps": ["step1", "step2"]
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
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant helping Tim Verhoogt generate smart, actionable todo items for his projects at Evos Amsterdam. Based on the project context and recent notes, suggest relevant tasks that would help move the project forward.

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

    const messages = [
      {
        role: 'system',
        content: `You are helping Tim Verhoogt, continuous improvement advisor at Evos Amsterdam, generate professional reports. 

        ${reportPrompts[reportType]}
        
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
}

export default new LLMService();
