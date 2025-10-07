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
  active_todos?: any[];
  recent_workload?: any[];
  recent_gratitude?: any[];
  coping_strategies?: any[];
  project_summary?: any[];
  work_preferences?: any;
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
   * Generate mood-adaptive coaching response
   */
  async generateMoodAdaptiveCoaching(userMessage: string, userId: string = 'default'): Promise<CoachingResponse> {
    try {
      // Get recent mood data
      const recentMood = await this.getRecentMoodData(userId);
      const moodContext = this.buildMoodContext(recentMood);
      
      // Get other context data
      const context = await this.buildCoachingContext(userId);
      
      // Determine coaching style based on mood
      const coachingStyle = this.determineCoachingStyle(recentMood);
      
      const request: CoachingRequest = {
        user_message: userMessage,
        session_type: 'mood_adaptive',
        coaching_style: coachingStyle,
        context: context,
        mood_context: moodContext
      };
      
      return await this.generateCoachingResponse(request);
    } catch (error) {
      console.error('Error in mood-adaptive coaching:', error);
      return {
        ai_response: "I'm here to support you. Could you tell me more about what's on your mind?",
        coaching_insights: [],
        suggested_actions: [],
        follow_up_questions: ["How are you feeling today?", "What would be most helpful right now?"]
      };
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
          model: 'anthropic/claude-3.7-sonnet',
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
      case 'gentle_supportive':
        basePersonality = 'You are a gentle, nurturing coach who prioritizes emotional support and validation. Use warm, encouraging language and focus on building confidence. Be extra patient and understanding, offering comfort and reassurance.';
        break;
      case 'balanced_encouraging':
        basePersonality = 'You are a balanced coach who provides both support and gentle challenge. Offer encouragement while suggesting manageable steps forward. Be understanding but also motivational.';
        break;
      case 'motivational_challenging':
        basePersonality = 'You are an energetic, motivational coach who can push for growth and set ambitious goals. Use confident, inspiring language and challenge the user to reach their potential.';
        break;
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

    let moodGuidance = '';
    if (request.mood_context) {
      moodGuidance = `
MOOD-AWARE COACHING:
- ${request.mood_context}
- Adjust your tone and approach based on their current emotional state
- If they're struggling (low mood/high stress), be extra gentle and supportive
- If they're doing well (high mood/low stress), you can be more challenging and motivational
- Always validate their feelings while offering constructive guidance
- Consider their recent triggers and coping strategies in your suggestions`;
    }

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
${moodGuidance}

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

    // Add mood context with 30-day trend analysis
    if (context.recent_mood?.length > 0) {
      const avgMood = context.recent_mood.reduce((sum, m) => sum + m.mood_score, 0) / context.recent_mood.length;
      const avgStress = context.recent_mood.reduce((sum, m) => sum + (m.stress_level || 5), 0) / context.recent_mood.length;
      const avgEnergy = context.recent_mood.reduce((sum, m) => sum + (m.energy_level || 5), 0) / context.recent_mood.length;

      const moodTrend = avgMood >= 7 ? 'positive' : avgMood >= 5 ? 'neutral' : 'concerning';
      contextSummary += `\n**Mood & Wellbeing (30-day trend):**\n`;
      contextSummary += `- Overall mood: ${moodTrend} (avg ${avgMood.toFixed(1)}/10 over ${context.recent_mood.length} days)\n`;
      contextSummary += `- Stress level: ${avgStress.toFixed(1)}/10, Energy: ${avgEnergy.toFixed(1)}/10\n`;
    }

    // Add workload context
    if (context.recent_workload && context.recent_workload.length > 0) {
      const workDays = context.recent_workload.length;
      const avgIntensity = context.recent_workload.reduce((sum: number, w: any) => sum + (w.intensity_level || 0), 0) / workDays;
      const avgProductivity = context.recent_workload.reduce((sum: number, w: any) => sum + (w.productivity_score || 0), 0) / workDays;

      contextSummary += `\n**Recent Workload (${workDays} days):**\n`;
      contextSummary += `- Average work intensity: ${avgIntensity.toFixed(1)}/10\n`;
      contextSummary += `- Average productivity: ${avgProductivity.toFixed(1)}/10\n`;
    }

    // Add project portfolio context
    if (context.project_summary && context.project_summary.length > 0) {
      const totalPending = context.project_summary.reduce((sum: number, p: any) => sum + (p.pending_todos || 0), 0);
      const totalCompleted = context.project_summary.reduce((sum: number, p: any) => sum + (p.completed_todos || 0), 0);
      const highPriorityCount = context.project_summary.reduce((sum: number, p: any) => sum + (p.high_priority_pending || 0), 0);

      contextSummary += `\n**Project Portfolio:**\n`;
      contextSummary += `- Active projects: ${context.project_summary.length}\n`;
      contextSummary += `- Total pending tasks: ${totalPending}, Completed: ${totalCompleted}\n`;
      contextSummary += `- High priority pending: ${highPriorityCount}\n`;

      if (context.project_summary.length > 0 && context.project_summary.length <= 3) {
        contextSummary += `- Projects: ${context.project_summary.map((p: any) => p.name).join(', ')}\n`;
      }
    }

    // Add active todos (top priority items)
    if (context.active_todos && context.active_todos.length > 0) {
      const highPriority = context.active_todos.filter((t: any) => t.priority === 'high');
      const overdueTodos = context.active_todos.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());

      contextSummary += `\n**Active Tasks:**\n`;
      contextSummary += `- Total active: ${context.active_todos.length} (${highPriority.length} high priority)\n`;
      if (overdueTodos.length > 0) {
        contextSummary += `- ⚠️ ${overdueTodos.length} overdue task(s)\n`;
      }

      // List top 3 high priority tasks
      if (highPriority.length > 0) {
        contextSummary += `- Top priorities: ${highPriority.slice(0, 3).map((t: any) => t.title).join('; ')}\n`;
      }
    }

    // Add achievement context
    if (context.active_achievements?.length > 0) {
      const activeCount = context.active_achievements.length;
      contextSummary += `\n**Active Goals & Achievements:**\n`;
      contextSummary += `- ${activeCount} achievement(s) in progress\n`;
    }

    // Add skill gaps context
    if (context.skill_gaps?.length > 0) {
      const topGap = context.skill_gaps[0];
      contextSummary += `\n**Skill Development:**\n`;
      contextSummary += `- Priority area: ${topGap.skill_name} (current: ${topGap.current_level}, target: ${topGap.target_level})\n`;
    }

    // Add gratitude context (positive psychology anchor)
    if (context.recent_gratitude && context.recent_gratitude.length > 0) {
      contextSummary += `\n**Recent Gratitude:**\n`;
      contextSummary += `- ${context.recent_gratitude.length} gratitude entries logged recently\n`;
      if (context.recent_gratitude[0]?.response) {
        contextSummary += `- Most recent: "${context.recent_gratitude[0].response.substring(0, 80)}..."\n`;
      }
    }

    // Add coping strategies context
    if (context.coping_strategies && context.coping_strategies.length > 0) {
      const effectiveStrategies = context.coping_strategies.filter((s: any) => s.avg_effectiveness >= 4);
      if (effectiveStrategies.length > 0) {
        contextSummary += `\n**Effective Coping Strategies:**\n`;
        contextSummary += `- ${effectiveStrategies.map((s: any) => s.strategy_name).slice(0, 3).join(', ')}\n`;
      }
    }

    // Add work preferences
    if (context.work_preferences) {
      const prefs = context.work_preferences;
      if (prefs.preferred_work_hours || prefs.energy_peaks) {
        contextSummary += `\n**Work Preferences:**\n`;
        if (prefs.preferred_work_hours) {
          contextSummary += `- Preferred work hours: ${prefs.preferred_work_hours}\n`;
        }
        if (prefs.energy_peaks) {
          contextSummary += `- Energy peaks: ${prefs.energy_peaks}\n`;
        }
      }
    }

    // Add recent work context
    if (context.recent_work?.length > 0) {
      contextSummary += `\n**Recent Work Activity:**\n`;
      contextSummary += `- ${context.recent_work.length} recent notes/updates logged\n`;
    }

    if (mood_context) {
      contextSummary += `\n**Current Mood Context:**\n${mood_context}\n`;
    }

    return `Session Type: ${session_type}

COMPREHENSIVE CONTEXT:
${contextSummary}

User's Message: "${user_message}"

Please provide a personalized coaching response that:
1. Acknowledges their specific situation based on the comprehensive context above
2. Draws connections between their mood, workload, tasks, and wellbeing
3. Provides specific, actionable guidance considering their work preferences and effective coping strategies
4. Highlights any concerning patterns (e.g., high stress + high workload, overdue tasks)
5. Reinforces positive behaviors (e.g., gratitude practice, using effective coping strategies)`;
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
          model: 'anthropic/claude-3.7-sonnet',
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
          model: 'anthropic/claude-3.7-sonnet',
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

  /**
   * Get recent mood data for adaptive coaching
   */
  private async getRecentMoodData(userId: string): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT mood_score, energy_level, stress_level, motivation_level, 
               mood_tags, notes, triggers, coping_strategies_used, mood_date
        FROM mood_tracking 
        WHERE user_id = ? 
        ORDER BY mood_date DESC 
        LIMIT 7
      `, [userId]);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error fetching recent mood data:', error);
      return [];
    }
  }

  /**
   * Build mood context for coaching
   */
  private buildMoodContext(recentMood: any[]): string {
    if (recentMood.length === 0) {
      return "No recent mood data available. User hasn't logged mood entries recently.";
    }

    const latest = recentMood[0];
    const avgMood = recentMood.reduce((sum, entry) => sum + entry.mood_score, 0) / recentMood.length;
    const avgStress = recentMood.reduce((sum, entry) => sum + entry.stress_level, 0) / recentMood.length;
    const avgEnergy = recentMood.reduce((sum, entry) => sum + entry.energy_level, 0) / recentMood.length;

    let context = `Recent mood context (last ${recentMood.length} entries):\n`;
    context += `- Latest mood: ${latest.mood_score}/10 (${latest.mood_date})\n`;
    context += `- Average mood: ${avgMood.toFixed(1)}/10\n`;
    context += `- Average stress: ${avgStress.toFixed(1)}/10\n`;
    context += `- Average energy: ${avgEnergy.toFixed(1)}/10\n`;
    
    if (latest.mood_tags) {
      context += `- Recent mood tags: ${latest.mood_tags}\n`;
    }
    if (latest.triggers) {
      context += `- Recent triggers: ${latest.triggers}\n`;
    }
    if (latest.coping_strategies_used) {
      context += `- Coping strategies used: ${latest.coping_strategies_used}\n`;
    }

    return context;
  }

  /**
   * Determine coaching style based on mood
   */
  private determineCoachingStyle(recentMood: any[]): string {
    if (recentMood.length === 0) {
      return 'supportive';
    }

    const latest = recentMood[0];
    const avgMood = recentMood.reduce((sum, entry) => sum + entry.mood_score, 0) / recentMood.length;
    const avgStress = recentMood.reduce((sum, entry) => sum + entry.stress_level, 0) / recentMood.length;

    // Low mood or high stress = gentle, supportive
    if (avgMood < 5 || avgStress > 7) {
      return 'gentle_supportive';
    }
    
    // Moderate mood/stress = balanced
    if (avgMood >= 5 && avgMood < 7 && avgStress >= 4 && avgStress <= 7) {
      return 'balanced_encouraging';
    }
    
    // High mood, low stress = motivational, challenging
    if (avgMood >= 7 && avgStress < 4) {
      return 'motivational_challenging';
    }

    // Default to supportive
    return 'supportive';
  }

  /**
   * Build coaching context with mood data
   */
  private async buildCoachingContext(userId: string): Promise<CoachingContext> {
    // This would integrate with existing context building
    // For now, return a basic context
    return {
      user_preferences: {},
      recent_mood: await this.getRecentMoodData(userId),
      active_achievements: [],
      skill_gaps: [],
      recent_work: [],
      recent_reflections: []
    };
  }
}

export default new LLMCoachingService();
