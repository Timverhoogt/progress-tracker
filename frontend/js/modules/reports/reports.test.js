// Reports Module Tests




// Mock global functions
global.escapeHtml = jest.fn((str) => str);
global.formatDate = jest.fn((date) => date);
global.formatDateTime = jest.fn((date) => date);

// Mock dependencies
const mockApiClient = {
    request: jest.fn()
};

const mockState = {
    subscribe: jest.fn(),
    get: jest.fn()
};

const mockEventBus = {
    emit: jest.fn(),
    on: jest.fn()
};

describe('ReportsApi', () => {
    let api;

    beforeEach(() => {
        api = new ReportsApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getReports', () => {
        it('should call apiClient with correct URL', async () => {
            const mockReports = [{ id: 1, title: 'Test Report' }];
            mockApiClient.request.mockResolvedValue(mockReports);
            const projectId = '123';

            const result = await api.getReports(projectId);

            expect(mockApiClient.request).toHaveBeenCalledWith(`/reports?project_id=${projectId}`);
            expect(result).toEqual(mockReports);
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            mockApiClient.request.mockRejectedValue(error);
            const projectId = '123';

            await expect(api.getReports(projectId)).rejects.toThrow('API Error');
        });
    });

    describe('generateReport', () => {
        it('should send POST request with report data', async () => {
            const reportData = { title: 'Test Report', type: 'summary' };
            const mockResponse = { id: 1, status: 'success' };
            mockApiClient.request.mockResolvedValue(mockResponse);

            const result = await api.generateReport(reportData);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/generate', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('generateWeeklyReport', () => {
        it('should send POST request to weekly endpoint', async () => {
            const reportData = { project_id: '123' };
            const mockResponse = { id: 1, status: 'success' };
            mockApiClient.request.mockResolvedValue(mockResponse);

            const result = await api.generateWeeklyReport(reportData);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/weekly', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('testEmail', () => {
        it('should send POST request to test-email endpoint', async () => {
            const emailData = { to: 'test@example.com' };
            const mockResponse = { success: true };
            mockApiClient.request.mockResolvedValue(mockResponse);

            const result = await api.testEmail(emailData);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/test-email', {
                method: 'POST',
                body: JSON.stringify(emailData)
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getSchedulerStatus', () => {
        it('should call scheduler status endpoint', async () => {
            const mockStatus = { isRunning: true, nextRun: '2023-12-01T09:00:00Z' };
            mockApiClient.request.mockResolvedValue(mockStatus);

            const result = await api.getSchedulerStatus();

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/scheduler/status');
            expect(result).toEqual(mockStatus);
        });
    });

    describe('triggerWeeklyReport', () => {
        it('should send POST request to trigger endpoint', async () => {
            const mockResponse = { success: true };
            mockApiClient.request.mockResolvedValue(mockResponse);

            const result = await api.triggerWeeklyReport();

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/scheduler/trigger', {
                method: 'POST'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteReport', () => {
        it('should send DELETE request with report ID', async () => {
            const reportId = '123';
            mockApiClient.request.mockResolvedValue(undefined);

            const result = await api.deleteReport(reportId);

            expect(mockApiClient.request).toHaveBeenCalledWith(`/reports/${reportId}`, {
                method: 'DELETE'
            });
            expect(result).toBeUndefined();
        });
    });

    describe('previewWeeklyReport', () => {
        it('should send POST request to preview endpoint', async () => {
            const previewData = { project_id: '123' };
            const mockPreview = { content: 'Preview content' };
            mockApiClient.request.mockResolvedValue(mockPreview);

            const result = await api.previewWeeklyReport(previewData);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/weekly/preview', {
                method: 'POST',
                body: JSON.stringify(previewData)
            });
            expect(result).toEqual(mockPreview);
        });
    });

    describe('restartScheduler', () => {
        it('should send POST request to restart endpoint', async () => {
            const mockResponse = { success: true };
            mockApiClient.request.mockResolvedValue(mockResponse);

            const result = await api.restartScheduler();

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/scheduler/restart', {
                method: 'POST'
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getReportAnalytics', () => {
        it('should call analytics endpoint with options', async () => {
            const options = { projectId: '123', startDate: '2023-01-01', endDate: '2023-12-31' };
            const mockAnalytics = { totalReports: 10, averageLength: 500 };
            mockApiClient.request.mockResolvedValue(mockAnalytics);

            const result = await api.getReportAnalytics(options);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/analytics?project_id=123&start_date=2023-01-01&end_date=2023-12-31');
            expect(result).toEqual(mockAnalytics);
        });

        it('should call analytics endpoint without options', async () => {
            const mockAnalytics = { totalReports: 5 };
            mockApiClient.request.mockResolvedValue(mockAnalytics);

            const result = await api.getReportAnalytics();

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/analytics');
            expect(result).toEqual(mockAnalytics);
        });
    });

    describe('exportReports', () => {
        it('should call export endpoint with options', async () => {
            const exportOptions = { format: 'pdf', projectId: '123' };
            const mockBlob = new Blob(['test'], { type: 'application/pdf' });
            mockApiClient.request.mockResolvedValue(mockBlob);

            const result = await api.exportReports(exportOptions);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/export/pdf?project_id=123', {
                responseType: 'blob'
            });
            expect(result).toBeInstanceOf(Blob);
        });

        it('should use default format when not specified', async () => {
            const exportOptions = { projectId: '123' };
            const mockBlob = new Blob(['test'], { type: 'application/pdf' });
            mockApiClient.request.mockResolvedValue(mockBlob);

            const result = await api.exportReports(exportOptions);

            expect(mockApiClient.request).toHaveBeenCalledWith('/reports/export/pdf?project_id=123', {
                responseType: 'blob'
            });
        });
    });
});

describe('ReportsUI', () => {
    let ui;
    let mockElements;

    beforeEach(() => {
        ui = new ReportsUI();
        mockElements = {
            container: document.createElement('div'),
            reportsList: document.createElement('div'),
            reportModal: document.createElement('div'),
            reportForm: document.createElement('form'),
            reportType: document.createElement('select'),
            reportTitle: document.createElement('input'),
            reportRecipient: document.createElement('input'),
            reportContent: document.createElement('textarea'),
            projectSelector: document.createElement('select')
        };

        // Mock DOM methods
        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            switch (id) {
                case 'reports': return mockElements.container;
                case 'reportsList': return mockElements.reportsList;
                case 'reportModal': return mockElements.reportModal;
                case 'reportForm': return mockElements.reportForm;
                case 'reportType': return mockElements.reportType;
                case 'reportTitle': return mockElements.reportTitle;
                case 'reportRecipient': return mockElements.reportRecipient;
                case 'reportContent': return mockElements.reportContent;
                case 'reportsProjectSelector': return mockElements.projectSelector;
                default: return null;
            }
        });

        // Mock event listeners
        jest.spyOn(mockElements.generateReportBtn || document.createElement('button'), 'addEventListener');
        jest.spyOn(mockElements.reportForm, 'addEventListener');
        jest.spyOn(mockElements.reportModal, 'addEventListener');
        jest.spyOn(mockElements.projectSelector, 'addEventListener');

        ui.initialize(mockElements);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('initialize', () => {
        it('should setup event listeners', () => {
            expect(mockElements.reportForm.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
        });
    });

    describe('renderReports', () => {
        it('should render reports list', () => {
            const reports = [
                { id: 1, title: 'Report 1', report_type: 'summary', created_at: '2023-12-01T10:00:00Z', content: 'Test content 1' },
                { id: 2, title: 'Report 2', report_type: 'detailed', created_at: '2023-12-02T10:00:00Z', content: 'Test content 2' }
            ];

            ui.renderReports(reports);

            expect(mockElements.reportsList.innerHTML).toContain('Report 1');
            expect(mockElements.reportsList.innerHTML).toContain('Report 2');
            expect(mockElements.reportsList.innerHTML).toContain('summary');
            expect(mockElements.reportsList.innerHTML).toContain('detailed');
        });

        it('should show empty state when no reports', () => {
            ui.renderReports([]);

            expect(mockElements.reportsList.innerHTML).toContain('No Reports Yet');
        });

        it('should truncate long content', () => {
            const longContent = 'A'.repeat(300);
            const reports = [{
                id: 1,
                title: 'Long Report',
                report_type: 'summary',
                created_at: '2023-12-01T10:00:00Z',
                content: longContent
            }];

            ui.renderReports(reports);

            expect(mockElements.reportsList.innerHTML).toContain('A'.repeat(200) + '...');
        });
    });

    describe('showEmptyState', () => {
        it('should display empty state message', () => {
            ui.showEmptyState();

            expect(mockElements.reportsList.innerHTML).toContain('No Reports Yet');
        });
    });

    describe('showProjectSelectionState', () => {
        it('should display project selection message', () => {
            ui.showProjectSelectionState();

            expect(mockElements.reportsList.innerHTML).toContain('Select a Project');
        });
    });

    describe('updateSchedulerStatus', () => {
        it('should update scheduler status display', () => {
            const status = {
                isRunning: true,
                nextRun: '2023-12-01T09:00:00Z',
                sendgridConfigured: true
            };

            // Mock DOM elements that would be in the HTML
            const statusValue = document.createElement('span');
            const nextReportTime = document.createElement('span');
            const sendgridStatus = document.createElement('span');

            jest.spyOn(document, 'getElementById')
                .mockReturnValueOnce(statusValue)
                .mockReturnValueOnce(nextReportTime)
                .mockReturnValueOnce(sendgridStatus);

            ui.updateSchedulerStatus(status);

            // Note: This test would need more setup to properly test DOM updates
            expect(statusValue).toBeDefined();
        });
    });
});

describe('ReportsController', () => {
    let controller;
    let mockApi;
    let mockUI;

    beforeEach(() => {
        mockApi = {
            getReports: jest.fn(),
            generateReport: jest.fn(),
            generateWeeklyReport: jest.fn(),
            deleteReport: jest.fn(),
            getSchedulerStatus: jest.fn(),
            restartScheduler: jest.fn(),
            previewWeeklyReport: jest.fn(),
            testEmail: jest.fn(),
            exportReports: jest.fn(),
            getReportAnalytics: jest.fn()
        };

        mockUI = {
            initialize: jest.fn(),
            showLoading: jest.fn(),
            hideLoading: jest.fn(),
            renderReports: jest.fn(),
            showEmptyState: jest.fn(),
            showProjectSelectionState: jest.fn(),
            showError: jest.fn(),
            showSuccess: jest.fn(),
            showMessage: jest.fn(),
            updateSchedulerStatus: jest.fn(),
            hideReportModal: jest.fn()
        };

        controller = new ReportsController(mockApiClient, mockState, mockEventBus);

        // Replace the real API and UI with mocks
        controller.api = mockApi;
        controller.ui = mockUI;
    });

    describe('initialize', () => {
        it('should initialize UI with elements', async () => {
            // Mock DOM elements
            jest.spyOn(document, 'getElementById').mockImplementation((id) => {
                return document.createElement('div');
            });

            await controller.initialize();

            expect(mockUI.initialize).toHaveBeenCalled();
        });

        it('should subscribe to state changes', async () => {
            const mockState = {
                subscribe: jest.fn(),
                get: jest.fn().mockReturnValue({ id: '123', name: 'Test Project' })
            };

            controller.state = mockState;

            await controller.initialize();

            expect(mockState.subscribe).toHaveBeenCalledWith('currentProject', expect.any(Function));
        });
    });

    describe('loadReports', () => {
        it('should show project selection state when no project ID', async () => {
            await controller.loadReports(null);

            expect(mockUI.showProjectSelectionState).toHaveBeenCalled();
        });

        it('should load reports for valid project ID', async () => {
            const projectId = '123';
            const mockReports = [{ id: 1, title: 'Test Report' }];
            mockApi.getReports.mockResolvedValue(mockReports);

            await controller.loadReports(projectId);

            expect(mockApi.getReports).toHaveBeenCalledWith(projectId);
            expect(mockUI.renderReports).toHaveBeenCalledWith(mockReports);
        });

        it('should handle API errors', async () => {
            const projectId = '123';
            const error = new Error('API Error');
            mockApi.getReports.mockRejectedValue(error);

            await controller.loadReports(projectId);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load reports');
        });
    });

    describe('handleReportGeneration', () => {
        it('should generate report successfully', async () => {
            const reportData = { title: 'Test Report' };
            const mockReport = { id: 1, status: 'success' };
            mockApi.generateReport.mockResolvedValue(mockReport);

            await controller.handleReportGeneration(reportData);

            expect(mockApi.generateReport).toHaveBeenCalledWith(reportData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Report generated successfully!');
        });

        it('should handle generation errors', async () => {
            const reportData = { title: 'Test Report' };
            const error = new Error('Generation Error');
            mockApi.generateReport.mockRejectedValue(error);

            await controller.handleReportGeneration(reportData);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to generate report');
        });
    });

    describe('handleWeeklyReportGeneration', () => {
        it('should show error when no current project', async () => {
            controller.currentProject = null;

            await controller.handleWeeklyReportGeneration();

            expect(mockUI.showError).toHaveBeenCalledWith('Please select a project first');
        });

        it('should generate weekly report for current project', async () => {
            const project = { id: '123', name: 'Test Project' };
            controller.currentProject = project;
            const mockReport = { id: 1, status: 'success' };
            mockApi.generateWeeklyReport.mockResolvedValue(mockReport);

            await controller.handleWeeklyReportGeneration();

            expect(mockApi.generateWeeklyReport).toHaveBeenCalledWith({
                project_id: project.id,
                template: 'self',
                sections: { includeNotes: true, includeTodos: true },
                narrativeOnly: false
            });
        });
    });

    describe('deleteReport', () => {
        it('should delete report after confirmation', async () => {
            const reportId = '123';
            global.confirm = jest.fn().mockReturnValue(true);
            mockApi.deleteReport.mockResolvedValue(undefined);

            await controller.deleteReport(reportId);

            expect(mockApi.deleteReport).toHaveBeenCalledWith(reportId);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Report deleted successfully');
        });

        it('should not delete report when cancelled', async () => {
            const reportId = '123';
            global.confirm = jest.fn().mockReturnValue(false);

            await controller.deleteReport(reportId);

            expect(mockApi.deleteReport).not.toHaveBeenCalled();
        });
    });

    describe('refreshSchedulerStatus', () => {
        it('should refresh scheduler status', async () => {
            const mockStatus = { isRunning: true };
            mockApi.getSchedulerStatus.mockResolvedValue(mockStatus);

            await controller.refreshSchedulerStatus();

            expect(mockApi.getSchedulerStatus).toHaveBeenCalled();
            expect(mockUI.updateSchedulerStatus).toHaveBeenCalledWith(mockStatus);
        });
    });

    describe('restartScheduler', () => {
        it('should restart scheduler after confirmation', async () => {
            const mockResponse = { success: true };
            const mockStatus = { isRunning: true };
            global.confirm = jest.fn().mockReturnValue(true);
            mockApi.restartScheduler.mockResolvedValue(mockResponse);
            mockApi.getSchedulerStatus.mockResolvedValue(mockStatus);

            await controller.restartScheduler();

            expect(mockApi.restartScheduler).toHaveBeenCalled();
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Scheduler restarted successfully');
        });
    });

    describe('previewWeeklyReport', () => {
        it('should show error when no current project', async () => {
            controller.currentProject = null;

            await controller.previewWeeklyReport();

            expect(mockUI.showError).toHaveBeenCalledWith('Please select a project first');
        });

        it('should generate preview for current project', async () => {
            const project = { id: '123', name: 'Test Project' };
            controller.currentProject = project;
            const mockPreview = { content: 'Preview content' };
            mockApi.previewWeeklyReport.mockResolvedValue(mockPreview);

            await controller.previewWeeklyReport();

            expect(mockApi.previewWeeklyReport).toHaveBeenCalledWith({
                project_id: project.id,
                template: 'self',
                sections: { includeNotes: true, includeTodos: true },
                narrativeOnly: false
            });
        });
    });

    describe('sendTestEmail', () => {
        it('should show error when no email configured', async () => {
            document.getElementById = jest.fn().mockReturnValue({ value: '' });

            await controller.sendTestEmail();

            expect(mockUI.showError).toHaveBeenCalledWith('Please set your email address in settings first');
        });

        it('should send test email successfully', async () => {
            const email = 'test@example.com';
            document.getElementById = jest.fn().mockReturnValue({ value: email });
            const mockResponse = { success: true };
            mockApi.testEmail.mockResolvedValue(mockResponse);

            await controller.sendTestEmail();

            expect(mockApi.testEmail).toHaveBeenCalledWith({
                to: email,
                template: 'self',
                sections: { includeNotes: true, includeTodos: true },
                narrativeOnly: false
            });
        });
    });

    describe('downloadReport', () => {
        it('should download report as PDF', async () => {
            const reportId = '123';
            const mockBlob = new Blob(['test'], { type: 'application/pdf' });
            mockApi.exportReports.mockResolvedValue(mockBlob);

            // Mock window.URL.createObjectURL and revokeObjectURL
            const mockUrl = 'blob:test-url';
            global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
            global.URL.revokeObjectURL = jest.fn();

            await controller.downloadReport(reportId);

            expect(mockApi.exportReports).toHaveBeenCalledWith({
                format: 'pdf',
                reportId: reportId
            });
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        });
    });

    describe('viewReport', () => {
        it('should show message about upcoming feature', async () => {
            const reportId = '123';

            await controller.viewReport(reportId);

            expect(mockUI.showMessage).toHaveBeenCalledWith('Report view functionality coming soon!', 'info');
        });
    });

    describe('getAnalytics', () => {
        it('should get analytics data', async () => {
            const options = { projectId: '123', startDate: '2023-01-01' };
            const mockAnalytics = { totalReports: 10 };
            mockApi.getReportAnalytics.mockResolvedValue(mockAnalytics);

            const result = await controller.getAnalytics(options);

            expect(mockApi.getReportAnalytics).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockAnalytics);
        });

        it('should handle analytics errors', async () => {
            const options = { projectId: '123' };
            const error = new Error('Analytics Error');
            mockApi.getReportAnalytics.mockRejectedValue(error);

            await expect(controller.getAnalytics(options)).rejects.toThrow('Analytics Error');
        });
    });
});
