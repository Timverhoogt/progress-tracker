import axios from 'axios';
import dotenv from 'dotenv';
import { initializeDatabase } from '../database/sqlite';

dotenv.config();

const db = initializeDatabase();

interface CoachingContext {
  user_preferences: any;
  recent_mood: any[];
  active_achievements: any[];
  skill_gaps: any[];
  recent_work: any[];
  recent_reflections: any[];
}

interface CoachingRequest {
  user_message: string;
  session_type: string;
  coaching_style: string;
  context: CoachingContext;
  mood_context?: string;
}

interface CoachingResponse {
  ai_response: string;
  coaching_insights: string[];
  suggested_actions: string[];
  follow_up_questions: string[];
}

class LLMCoachingService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ OPENROUTER_API_KEY not configured. AI coaching features will be limited.');
    }
  }

  /**
   * Generate personalized coaching response
   */
  async generateCoachingResponse(request: CoachingRequest): Promise<CoachingResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(request);
    }

    try {
      const systemPrompt = await this.buildCoachingSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'https://tracker.evosgpt.eu',
            'X-Title': 'Progress Tracker - Personal Development Coach'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseCoachingResponse(aiResponse);
    } catch (error) {
      console.error('Error generating coaching response:', error);
      return this.getFallbackResponse(request);
    }
  }

  /**
   * Build coaching system prompt based on user preferences and context
   */
  private async buildCoachingSystemPrompt(request: CoachingRequest): Promise<string> {
    const { coaching_style, context } = request;
    const preferences = context.user_preferences?.coaching || {};

    let basePersonality = '';
    switch (coaching_style) {
      case 'supportive':
        basePersonality = 'You are a warm, encouraging, and empathetic coach who focuses on building confidence and providing emotional support.';
        break;
      case 'challenging':
        basePersonality = 'You are a direct, results-oriented coach who pushes for growth and accountability while maintaining respect.';
        break;
      case 'analytical':
        basePersonality = 'You are a data-driven, systematic coach who focuses on patterns, metrics, and logical problem-solving approaches.';
        break;
      default:
        basePersonality = 'You are a balanced coach who adapts your approach based on the situation and user needs.';
    }

    const detailLevel = preferences.detail_level || 'balanced';
    let responseGuidance = '';
    switch (detailLevel) {
      case 'brief':
        responseGuidance = 'Keep responses concise and action-oriented (2-3 sentences).';
        break;
      case 'detailed':
        responseGuidance = 'Provide comprehensive responses with detailed explanations and examples.';
        break;
      case 'comprehensive':
        responseGuidance = 'Offer thorough analysis with multiple perspectives, examples, and step-by-step guidance.';
        break;
      default:
        responseGuidance = 'Provide balanced responses that are informative but not overwhelming.';
    }

    const focusAreas = preferences.focus_areas?.split(',') || ['general'];
    const focusGuidance = `Focus particularly on: ${focusAreas.join(', ')}.`;

    return `${basePersonality}

CONTEXT ABOUT USER:
- You are coaching Tim Verhoogt, who works at Evos Amsterdam (petrochemical storage operations)
- His role involves continuous improvement projects, ML model testing, and stakeholder engagement
- He values professional growth, work-life balance, and systematic approaches to improvement

COACHING APPROACH:
- ${responseGuidance}
- ${focusGuidance}
- Always be encouraging and constructive, even when addressing challenges
- Draw connections between current situation and user's past experiences when relevant
- Suggest specific, actionable next steps
- Ask thoughtful follow-up questions to deepen reflection

RESPONSE FORMAT:
Structure your response as a coaching conversation with:
1. Acknowledgment of their situation/feelings
2. Insights or observations based on the context provided
3. Specific suggestions or strategies
4. Follow-up questions to encourage deeper thinking

Consider the user's recent mood, achievements, and work patterns in your response.`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(request: CoachingRequest): string {
    const { user_message, session_type, context, mood_context } = request;

    let contextSummary = '';
    
    // Add mood context
    if (context.recent_mood?.length > 0) {
      const avgMood = context.recent_mood.reduce((sum, m) => sum + m.mood_score, 0) / context.recent_mood.length;
      const moodTrend = avgMood >= 7 ? 'positive' : avgMood >= 5 ? 'neutral' : 'concerning';
      contextSummary += `Recent mood trend: ${moodTrend} (avg ${avgMood.toFixed(1)}/10). `;
    }

    // Add achievement context
    if (context.active_achievements?.length > 0) {
      const activeCount = context.active_achievements.length;
      contextSummary += `${activeCount} active achievement(s) in progress. `;
    }

    // Add skill gaps context
    if (context.skill_gaps?.length > 0) {
      const topGap = context.skill_gaps[0];
      contextSummary += `Key skill development area: ${topGap.skill_name} (gap: ${topGap.gap_size}). `;
    }

    // Add recent work context
    if (context.recent_work?.length > 0) {
      contextSummary += `Recent work focus: project progress and documentation. `;
    }

    if (mood_context) {
      contextSummary += `Current mood context: ${mood_context}. `;
    }

    return `Session Type: ${session_type}

Context: ${contextSummary}

User's Message: "${user_message}"

Please provide a personalized coaching response that addresses their message while considering the context provided.`;
  }

  /**
   * Parse AI response into structured coaching response
   */
  private parseCoachingResponse(aiResponse: string): CoachingResponse {
    // Extract insights, actions, and follow-up questions from the response
    // This is a simplified parsing - in production, you might use more sophisticated NLP
    
    const insights: string[] = [];
    const actions: string[] = [];
    const followUps: string[] = [];

    // Look for common patterns in coaching responses
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('insight') || line.includes('notice') || line.includes('pattern')) {
        insights.push(line.trim());
      } else if (line.includes('suggest') || line.includes('try') || line.includes('consider')) {
        actions.push(line.trim());
      } else if (line.includes('?')) {
        followUps.push(line.trim());
      }
    }

    return {
      ai_response: aiResponse,
      coaching_insights: insights.slice(0, 3), // Limit to top 3
      suggested_actions: actions.slice(0, 3),
      follow_up_questions: followUps.slice(0, 2)
    };
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  private getFallbackResponse(request: CoachingRequest): CoachingResponse {
    const { session_type, user_message } = request;
    
    let fallbackMessage = '';
    const insights = [];
    const actions = [];
    const followUps = [];

    switch (session_type) {
      case 'motivation':
        fallbackMessage = "I understand you're looking for some motivation. Remember that every small step forward is progress, and your dedication to continuous improvement at Evos is valuable.";
        insights.push("Your commitment to growth is evident in your use of this tracking system");
        actions.push("Take a moment to acknowledge what you've accomplished recently");
        followUps.push("What's one small win you can celebrate today?");
        break;
        
      case 'challenge':
        fallbackMessage = "Challenges are opportunities for growth. Based on your work at Evos, you have experience overcoming obstacles in complex technical environments.";
        insights.push("You have a track record of solving complex problems");
        actions.push("Break down the challenge into smaller, manageable parts");
        followUps.push("What similar challenges have you overcome before?");
        break;
        
      case 'skills':
        fallbackMessage = "Skill development is a continuous journey. Your work with ML models and continuous improvement projects shows you're already developing valuable capabilities.";
        insights.push("Your technical and analytical skills are growing through your project work");
        actions.push("Identify one specific skill to focus on this week");
        followUps.push("Which skills do you feel most excited to develop?");
        break;
        
      default:
        fallbackMessage = "Thank you for sharing that with me. Your reflection and self-awareness are important parts of professional growth.";
        insights.push("Self-reflection is a key component of professional development");
        actions.push("Consider documenting your thoughts and progress regularly");
        followUps.push("What insights are you gaining about yourself through this process?");
    }

    return {
      ai_response: fallbackMessage,
      coaching_insights: insights,
      suggested_actions: actions,
      follow_up_questions: followUps
    };
  }

  /**
   * Generate skill development suggestions based on user's skill gaps
   */
  async generateSkillDevelopmentPlan(userId: string = 'default'): Promise<any> {
    // Get skill gaps
    const skillGaps = await db.query(`
      SELECT *, (target_level - current_level) as gap_size
      FROM skills_assessment 
      WHERE user_id = ? AND current_level < target_level
      ORDER BY gap_size DESC
    `, [userId]);

    try {

      if (!this.apiKey || skillGaps.rows.length === 0) {
        return this.getFallbackSkillPlan(skillGaps.rows);
      }

      const systemPrompt = `You are a professional development advisor helping create personalized skill development plans.

CONTEXT:
- User works at Evos Amsterdam in petrochemical storage operations
- Focus on continuous improvement, ML models, and stakeholder engagement
- Prioritize practical, applicable skills for their industry and role

TASK:
Create a structured skill development plan with specific learning paths, resources, and milestones.

RESPONSE FORMAT:
For each skill, provide:
1. Learning path (beginner to advanced)
2. Specific resources and methods
3. Practice opportunities in their work context
4. Success metrics and milestones
5. Estimated timeline`;

      const userPrompt = `Create skill development plans for these skills:

${skillGaps.rows.map(skill => 
  `- ${skill.skill_name} (${skill.skill_category}): Current level ${skill.current_level}, Target ${skill.target_level}, Gap: ${skill.gap_size}`
).join('\n')}

Focus on the top 3 priority skills based on gap size and practical impact.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'https://tracker.evosgpt.eu',
            'X-Title': 'Progress Tracker - Skill Development Planning'
          }
        }
      );

      return {
        skill_plan: response.data.choices[0].message.content,
        priority_skills: skillGaps.rows.slice(0, 3),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating skill development plan:', error);
      return this.getFallbackSkillPlan(skillGaps.rows);
    }
  }

  /**
   * Fallback skill development plan
   */
  private getFallbackSkillPlan(skillGaps: any[]): any {
    if (skillGaps.length === 0) {
      return {
        skill_plan: "No skill gaps identified. Continue practicing and applying your current skills.",
        priority_skills: [],
        generated_at: new Date().toISOString()
      };
    }

    const topSkills = skillGaps.slice(0, 3);
    const plan = topSkills.map(skill => 
      `${skill.skill_name}: Focus on practical application in your projects. Set aside time weekly for deliberate practice.`
    ).join('\n');

    return {
      skill_plan: `Priority skill development areas:\n\n${plan}\n\nRecommendation: Choose one skill to focus on intensively for 2-4 weeks before adding others.`,
      priority_skills: topSkills,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Analyze mood patterns and provide insights
   */
  async analyzeMoodPatterns(userId: string = 'default', days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const moodData = await db.query(`
      SELECT mood_date, mood_score, energy_level, stress_level, motivation_level, notes, triggers
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      ORDER BY mood_date DESC
    `, [userId, startDateStr]);

    try {

      if (!this.apiKey || moodData.rows.length < 3) {
        return this.getFallbackMoodAnalysis(moodData.rows);
      }

      const systemPrompt = `You are a wellness coach analyzing mood patterns to provide actionable insights.

CONTEXT:
- User works in a demanding technical role with project deadlines
- Focus on practical wellbeing strategies that fit their professional context
- Identify patterns, triggers, and opportunities for improvement

TASK:
Analyze mood data and provide insights about patterns, triggers, and recommendations for better wellbeing.

RESPONSE FORMAT:
1. Key patterns observed
2. Identified triggers or correlations
3. Specific wellbeing recommendations
4. Early warning signs to watch for
5. Positive trends to build upon`;

      const moodSummary = moodData.rows.map(day => 
        `${day.mood_date}: Mood ${day.mood_score}/10, Energy ${day.energy_level || 'N/A'}/10, Stress ${day.stress_level || 'N/A'}/10${day.triggers ? `, Triggers: ${day.triggers}` : ''}`
      ).join('\n');

      const userPrompt = `Analyze these mood patterns over the last ${days} days:

${moodSummary}

Provide insights and recommendations for maintaining good wellbeing while managing professional responsibilities.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'https://tracker.evosgpt.eu',
            'X-Title': 'Progress Tracker - Mood Pattern Analysis'
          }
        }
      );

      return {
        analysis: response.data.choices[0].message.content,
        data_points: moodData.rows.length,
        period_days: days,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing mood patterns:', error);
      return this.getFallbackMoodAnalysis(moodData.rows);
    }
  }

  /**
   * Fallback mood analysis
   */
  private getFallbackMoodAnalysis(moodData: any[]): any {
    if (moodData.length === 0) {
      return {
        analysis: "No mood data available yet. Start tracking your daily mood to identify patterns and optimize your wellbeing.",
        data_points: 0,
        period_days: 0,
        generated_at: new Date().toISOString()
      };
    }

    const avgMood = moodData.reduce((sum, day) => sum + day.mood_score, 0) / moodData.length;
    const moodTrend = avgMood >= 7 ? 'positive' : avgMood >= 5 ? 'stable' : 'concerning';

    let analysis = `Based on ${moodData.length} mood entries, your average mood is ${avgMood.toFixed(1)}/10 (${moodTrend} trend).`;
    
    if (avgMood < 6) {
      analysis += "\n\nRecommendations:\n- Consider identifying stressors and developing coping strategies\n- Ensure adequate rest and work-life boundaries\n- Consider discussing with a mentor or healthcare provider if the trend continues";
    } else {
      analysis += "\n\nPositive trends observed. Continue maintaining good wellbeing practices and monitor for any changes.";
    }

    return {
      analysis,
      data_points: moodData.length,
      period_days: 30,
      generated_at: new Date().toISOString()
    };
  }
}

export default new LLMCoachingService();
