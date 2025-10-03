

class TimelinesApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get timeline data for a specific project
    async getTimeline(projectId) {
        return await this.api.getTimeline(projectId);
    }

    // Create a new milestone
    async createMilestone(data) {
        return await this.api.createMilestone(data);
    }

    // Update an existing milestone
    async updateMilestone(id, data) {
        return await this.api.updateMilestone(id, data);
    }

    // Delete a milestone
    async deleteMilestone(id) {
        return await this.api.deleteMilestone(id);
    }

    // Get AI timeline estimation for a project
    async estimateTimeline(projectId) {
        return await this.api.estimateTimeline(projectId);
    }

    // Get timeline items with filtering
    async getTimelineItems(projectId, filter = 'all') {
        const timelineData = await this.getTimeline(projectId);
        return this.filterTimelineItems(timelineData, filter);
    }

    // Get milestones only for a project
    async getMilestones(projectId) {
        const timelineData = await this.getTimeline(projectId);
        return timelineData.milestones || [];
    }

    // Get todos only for a project
    async getTodos(projectId) {
        const timelineData = await this.getTimeline(projectId);
        return timelineData.todos || [];
    }

    // Filter timeline items based on time period
    filterTimelineItems(timelineData, filter = 'all') {
        if (!timelineData) return { todos: [], milestones: [] };

        const { todos = [], milestones = [] } = timelineData;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let filteredTodos = todos;
        let filteredMilestones = milestones;

        switch (filter) {
            case 'week':
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                filteredTodos = todos.filter(todo => {
                    const dueDate = new Date(todo.due_date);
                    return dueDate >= today && dueDate <= nextWeek;
                });
                filteredMilestones = milestones.filter(milestone => {
                    const targetDate = new Date(milestone.target_date);
                    return targetDate >= today && targetDate <= nextWeek;
                });
                break;

            case 'month':
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);
                filteredTodos = todos.filter(todo => {
                    const dueDate = new Date(todo.due_date);
                    return dueDate >= today && dueDate <= nextMonth;
                });
                filteredMilestones = milestones.filter(milestone => {
                    const targetDate = new Date(milestone.target_date);
                    return targetDate >= today && targetDate <= nextMonth;
                });
                break;

            case 'quarter':
                const nextQuarter = new Date(today);
                nextQuarter.setMonth(today.getMonth() + 3);
                filteredTodos = todos.filter(todo => {
                    const dueDate = new Date(todo.due_date);
                    return dueDate >= today && dueDate <= nextQuarter;
                });
                filteredMilestones = milestones.filter(milestone => {
                    const targetDate = new Date(milestone.target_date);
                    return targetDate >= today && targetDate <= nextQuarter;
                });
                break;

            case 'year':
                const nextYear = new Date(today);
                nextYear.setFullYear(today.getFullYear() + 1);
                filteredTodos = todos.filter(todo => {
                    const dueDate = new Date(todo.due_date);
                    return dueDate >= today && dueDate <= nextYear;
                });
                filteredMilestones = milestones.filter(milestone => {
                    const targetDate = new Date(milestone.target_date);
                    return targetDate >= today && targetDate <= nextYear;
                });
                break;

            case 'overdue':
                filteredTodos = todos.filter(todo => {
                    const dueDate = new Date(todo.due_date);
                    return dueDate < today && todo.status !== 'completed';
                });
                filteredMilestones = milestones.filter(milestone => {
                    const targetDate = new Date(milestone.target_date);
                    return targetDate < today && milestone.status !== 'completed';
                });
                break;
        }

        return {
            todos: filteredTodos,
            milestones: filteredMilestones
        };
    }

    // Calculate timeline statistics
    calculateTimelineStats(timelineData) {
        if (!timelineData) return {};

        const { todos = [], milestones = [] } = timelineData;
        const now = new Date();

        const totalTodos = todos.length;
        const completedTodos = todos.filter(todo => todo.status === 'completed').length;
        const overdueTodos = todos.filter(todo => {
            const dueDate = new Date(todo.due_date);
            return dueDate < now && todo.status !== 'completed';
        }).length;

        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(milestone => milestone.status === 'completed').length;
        const overdueMilestones = milestones.filter(milestone => {
            const targetDate = new Date(milestone.target_date);
            return targetDate < now && milestone.status !== 'completed';
        }).length;

        return {
            todos: {
                total: totalTodos,
                completed: completedTodos,
                overdue: overdueTodos,
                completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
            },
            milestones: {
                total: totalMilestones,
                completed: completedMilestones,
                overdue: overdueMilestones,
                completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
            }
        };
    }
}


