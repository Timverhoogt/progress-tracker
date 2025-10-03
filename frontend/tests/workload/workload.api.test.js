/**
 * Workload API Tests
 * Tests the WorkloadApi class functionality
 */

import { WorkloadApi } from '../../js/modules/workload/workload.api.js';

// Mock the core API
const mockApiClient = {
    workload: {
        getTodayWorkload: jest.fn(),
        getWorkloadEntries: jest.fn(),
        getWorkloadStats: jest.fn(),
        getWorkloadPatterns: jest.fn(),
        getWorkloadBalanceAnalysis: jest.fn(),
        getBreakRecommendations: jest.fn(),
        getBalanceDashboard: jest.fn(),
        createWorkloadEntry: jest.fn(),
        updateWorkloadEntry: jest.fn(),
        deleteWorkloadEntry: jest.fn(),
    }
};

describe('WorkloadApi', () => {
    let workloadApi;

    beforeEach(() => {
        workloadApi = new WorkloadApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getTodayWorkload', () => {
        it('should call the API client getTodayWorkload method', async () => {
            const mockWorkload = {
                work_date: '2025-01-21',
                start_time: '09:00',
                end_time: '17:00',
                intensity_level: 7
            };
            mockApiClient.workload.getTodayWorkload.mockResolvedValue(mockWorkload);

            const result = await workloadApi.getTodayWorkload();

            expect(mockApiClient.workload.getTodayWorkload).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockWorkload);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.workload.getTodayWorkload.mockRejectedValue(error);

            await expect(workloadApi.getTodayWorkload()).rejects.toThrow('API Error');
        });
    });

    describe('getWorkloadEntries', () => {
        it('should call with correct parameters', async () => {
            const mockEntries = [
                {
                    work_date: '2025-01-20',
                    start_time: '08:00',
                    end_time: '16:00',
                    intensity_level: 6
                },
                {
                    work_date: '2025-01-21',
                    start_time: '09:00',
                    end_time: '17:00',
                    intensity_level: 8
                }
            ];
            mockApiClient.workload.getWorkloadEntries.mockResolvedValue(mockEntries);

            const result = await workloadApi.getWorkloadEntries('2025-01-20', '2025-01-21', 5);

            expect(mockApiClient.workload.getWorkloadEntries).toHaveBeenCalledWith('2025-01-20', '2025-01-21', 5);
            expect(result).toEqual(mockEntries);
        });

        it('should use default limit when not provided', async () => {
            const mockEntries = [{
                work_date: '2025-01-21',
                start_time: '09:00',
                end_time: '17:00',
                intensity_level: 7
            }];
            mockApiClient.workload.getWorkloadEntries.mockResolvedValue(mockEntries);

            await workloadApi.getWorkloadEntries('2025-01-20', '2025-01-21');

            expect(mockApiClient.workload.getWorkloadEntries).toHaveBeenCalledWith('2025-01-20', '2025-01-21', 10);
        });
    });

    describe('createWorkloadEntry', () => {
        it('should call the API client createWorkloadEntry method', async () => {
            const workloadData = {
                work_date: '2025-01-21',
                start_time: '09:00',
                end_time: '17:00',
                break_duration: 60,
                work_type: 'focused_work',
                intensity_level: 7,
                focus_level: 8,
                productivity_score: 7,
                tasks_completed: 5,
                location: 'office',
                notes: 'Good productive day'
            };
            const mockResponse = { id: 1, ...workloadData };
            mockApiClient.workload.createWorkloadEntry.mockResolvedValue(mockResponse);

            const result = await workloadApi.createWorkloadEntry(workloadData);

            expect(mockApiClient.workload.createWorkloadEntry).toHaveBeenCalledWith(workloadData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateWorkloadEntry', () => {
        it('should call the API client updateWorkloadEntry method', async () => {
            const date = '2025-01-21';
            const workloadData = {
                start_time: '08:30',
                end_time: '16:30',
                intensity_level: 8
            };
            const mockResponse = { work_date: date, ...workloadData };
            mockApiClient.workload.updateWorkloadEntry.mockResolvedValue(mockResponse);

            const result = await workloadApi.updateWorkloadEntry(date, workloadData);

            expect(mockApiClient.workload.updateWorkloadEntry).toHaveBeenCalledWith(date, workloadData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteWorkloadEntry', () => {
        it('should call the API client deleteWorkloadEntry method', async () => {
            const date = '2025-01-21';
            mockApiClient.workload.deleteWorkloadEntry.mockResolvedValue({ success: true });

            const result = await workloadApi.deleteWorkloadEntry(date);

            expect(mockApiClient.workload.deleteWorkloadEntry).toHaveBeenCalledWith(date);
            expect(result).toEqual({ success: true });
        });
    });

    describe('getWorkloadEntryByDate', () => {
        it('should find entry by date', async () => {
            const date = '2025-01-21';
            const mockEntries = [
                {
                    work_date: '2025-01-20',
                    start_time: '08:00',
                    end_time: '16:00',
                    intensity_level: 6
                },
                {
                    work_date: date,
                    start_time: '09:00',
                    end_time: '17:00',
                    intensity_level: 7
                }
            ];
            mockApiClient.workload.getWorkloadEntries.mockResolvedValue(mockEntries);

            const result = await workloadApi.getWorkloadEntryByDate(date);

            expect(mockApiClient.workload.getWorkloadEntries).toHaveBeenCalledWith(date, date);
            expect(result).toEqual(mockEntries[1]);
        });

        it('should return undefined when entry not found', async () => {
            const date = '2025-01-21';
            mockApiClient.workload.getWorkloadEntries.mockResolvedValue([]);

            const result = await workloadApi.getWorkloadEntryByDate(date);

            expect(result).toBeUndefined();
        });
    });

    describe('getWorkloadStats', () => {
        it('should call with default days when not provided', async () => {
            const mockStats = {
                average_work_hours: 7.5,
                total_work_hours: 150,
                total_entries: 20,
                average_productivity: 7.2
            };
            mockApiClient.workload.getWorkloadStats.mockResolvedValue(mockStats);

            const result = await workloadApi.getWorkloadStats();

            expect(mockApiClient.workload.getWorkloadStats).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockStats);
        });

        it('should call with custom days when provided', async () => {
            const mockStats = {
                average_work_hours: 8.0,
                total_work_hours: 40,
                total_entries: 5,
                average_productivity: 8.5
            };
            mockApiClient.workload.getWorkloadStats.mockResolvedValue(mockStats);

            const result = await workloadApi.getWorkloadStats(7);

            expect(mockApiClient.workload.getWorkloadStats).toHaveBeenCalledWith(7);
            expect(result).toEqual(mockStats);
        });
    });

    describe('calculateWorkHours', () => {
        it('should calculate work hours correctly', () => {
            const startTime = '09:00';
            const endTime = '17:00';
            const breakDuration = 60; // 1 hour break

            const result = workloadApi.calculateWorkHours(startTime, endTime, breakDuration);

            expect(result).toBe(7); // 8 hours minus 1 hour break = 7 hours
        });

        it('should return 0 for invalid times', () => {
            const result1 = workloadApi.calculateWorkHours(null, '17:00');
            const result2 = workloadApi.calculateWorkHours('09:00', null);
            const result3 = workloadApi.calculateWorkHours('17:00', '09:00'); // End before start

            expect(result1).toBe(0);
            expect(result2).toBe(0);
            expect(result3).toBe(0);
        });

        it('should handle zero break duration', () => {
            const startTime = '09:00';
            const endTime = '17:00';
            const breakDuration = 0;

            const result = workloadApi.calculateWorkHours(startTime, endTime, breakDuration);

            expect(result).toBe(8); // Full 8 hours
        });
    });
});

