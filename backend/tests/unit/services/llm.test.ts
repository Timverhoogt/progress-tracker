/**
 * Unit tests for LLM Service
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock settings service
jest.mock('../../../src/services/settings', () => ({
  default: {
    get: jest.fn().mockImplementation((key: string, defaultValue: any) => {
      const settings: Record<string, any> = {
        'llm_tone': 'professional',
        'llm_detail_level': 'balanced',
        'llm_language': 'auto',
        'llm_preset_template': 'default'
      };
      return Promise.resolve(settings[key] || defaultValue);
    })
  }
}));

import llmService from '../../../src/services/llm';

describe('LLM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enhanceNote', () => {
    test('should enhance note with LLM', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                enhanced_content: 'Enhanced note content',
                key_points: ['Point 1', 'Point 2'],
                action_items: ['Action 1']
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.enhanceNote({
        content: 'Original note',
        projectContext: 'Test Project'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.any(Array)
        }),
        expect.any(Object)
      );
    });

    test('should handle LLM API errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const result = await llmService.enhanceNote({
        content: 'Test note'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should include project context in prompt', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({ enhanced_content: 'Enhanced' })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await llmService.enhanceNote({
        content: 'Note content',
        projectContext: 'ML Project: Terminal Time Prediction'
      });

      const callArgs = mockedAxios.post.mock.calls[0];
      const messages = callArgs[1].messages;
      
      expect(messages.some((m: any) => 
        m.content.includes('ML Project: Terminal Time Prediction')
      )).toBe(true);
    });
  });

  describe('generateTodos', () => {
    test('should generate todos based on project info', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                todos: [
                  { title: 'Todo 1', priority: 'high' },
                  { title: 'Todo 2', priority: 'medium' }
                ]
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.generateTodos({
        projectName: 'Test Project',
        projectDescription: 'Project description',
        recentNotes: ['Note 1', 'Note 2']
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should handle empty recent notes', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({ todos: [] })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.generateTodos({
        projectName: 'Test Project',
        recentNotes: []
      });

      expect(result.success).toBe(true);
    });
  });

  describe('generateReport', () => {
    test('should generate status report', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                report: 'Status report content',
                summary: 'Summary'
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.generateReport({
        projectName: 'Test Project',
        notes: ['Note 1'],
        todos: ['Todo 1'],
        reportType: 'status'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should generate stakeholder report', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                report: 'Stakeholder report',
                executive_summary: 'Summary'
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.generateReport({
        projectName: 'Test Project',
        notes: ['Note 1'],
        todos: ['Todo 1'],
        reportType: 'stakeholder',
        recipient: 'John Doe'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('estimateTimeline', () => {
    test('should estimate project timeline', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                estimated_completion: '2025-12-31',
                confidence: 'medium',
                risks: ['Risk 1']
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.estimateTimeline({
        projectName: 'Test Project',
        datedTodos: [
          { title: 'Todo 1', due_date: '2025-11-01', status: 'pending' }
        ],
        milestones: [
          { title: 'Milestone 1', target_date: '2025-12-01', status: 'pending' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should handle empty todos and milestones', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                estimated_completion: 'Unknown',
                confidence: 'low'
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.estimateTimeline({
        projectName: 'Test Project',
        datedTodos: [],
        milestones: []
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await llmService.enhanceNote({
        content: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('LLM service unavailable');
    });

    test('should handle API rate limits', async () => {
      const rateLimitError = {
        response: {
          data: {
            error: {
              message: 'Rate limit exceeded'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValue(rateLimitError);

      const result = await llmService.enhanceNote({
        content: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    test('should handle invalid API responses', async () => {
      const mockResponse = {
        data: {
          choices: []
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await llmService.enhanceNote({
        content: 'Test'
      });

      // Should handle gracefully even with unexpected response structure
      expect(result).toBeDefined();
    });
  });
});

