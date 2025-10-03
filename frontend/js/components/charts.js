// Chart rendering utilities
class ChartUtils {
    // Create a simple bar chart
    static createBarChart(container, data, options = {}) {
        const {
            width = 400,
            height = 200,
            color = '#3b82f6',
            label = 'Value'
        } = options;

        // Clear container
        container.innerHTML = '';

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Calculate dimensions
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        // Find max value
        const maxValue = Math.max(...data.map(d => d.value));

        // Create bars
        data.forEach((item, index) => {
            const barWidth = chartWidth / data.length * 0.8;
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + (index * chartWidth / data.length) + (chartWidth / data.length * 0.1);
            const y = height - padding - barHeight;

            // Create bar
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', item.color || color);
            rect.setAttribute('rx', 4);

            svg.appendChild(rect);

            // Add label
            if (item.label) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x + barWidth / 2);
                text.setAttribute('y', y - 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.textContent = item.label;
                svg.appendChild(text);
            }
        });

        container.appendChild(svg);
        return svg;
    }

    // Create a simple line chart
    static createLineChart(container, data, options = {}) {
        const {
            width = 400,
            height = 200,
            color = '#3b82f6'
        } = options;

        // Clear container
        container.innerHTML = '';

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Calculate dimensions
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        if (data.length < 2) {
            // Show message for insufficient data
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '14');
            text.textContent = 'Insufficient data for line chart';
            svg.appendChild(text);
            container.appendChild(svg);
            return svg;
        }

        // Find min/max values
        const values = data.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Create line path
        const points = data.map((item, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = padding + ((maxValue - item.value) / (maxValue - minValue)) * chartHeight;
            return `${x},${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path.setAttribute('points', points);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', 2);

        svg.appendChild(path);

        // Add data points
        data.forEach((item, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = padding + ((maxValue - item.value) / (maxValue - minValue)) * chartHeight;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', color);
            svg.appendChild(circle);
        });

        container.appendChild(svg);
        return svg;
    }

    // Create a pie chart
    static createPieChart(container, data, options = {}) {
        const {
            width = 300,
            height = 300,
            radius = 100
        } = options;

        // Clear container
        container.innerHTML = '';

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const centerX = width / 2;
        const centerY = height / 2;

        // Calculate total
        const total = data.reduce((sum, item) => sum + item.value, 0);

        let currentAngle = -Math.PI / 2; // Start at top

        data.forEach((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 2 * Math.PI;

            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            // Calculate arc path
            const startX = centerX + radius * Math.cos(startAngle);
            const startY = centerY + radius * Math.sin(startAngle);
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = [
                `M ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'L ' + centerX + ' ' + centerY,
                'Z'
            ].join(' ');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', item.color || this.getDefaultColor(index));
            svg.appendChild(path);

            // Add label if provided
            if (item.label) {
                const labelAngle = startAngle + angle / 2;
                const labelRadius = radius * 1.2;
                const labelX = centerX + labelRadius * Math.cos(labelAngle);
                const labelY = centerY + labelRadius * Math.sin(labelAngle);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', labelX);
                text.setAttribute('y', labelY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.textContent = item.label;
                svg.appendChild(text);
            }

            currentAngle = endAngle;
        });

        container.appendChild(svg);
        return svg;
    }

    // Get default color for index
    static getDefaultColor(index) {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];
        return colors[index % colors.length];
    }

    // Create a progress chart (doughnut style)
    static createProgressChart(container, percentage, options = {}) {
        const {
            width = 200,
            height = 200,
            radius = 80,
            color = '#3b82f6',
            backgroundColor = '#e5e7eb'
        } = options;

        // Clear container
        container.innerHTML = '';

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const centerX = width / 2;
        const centerY = height / 2;

        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', centerX);
        bgCircle.setAttribute('cy', centerY);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', backgroundColor);
        bgCircle.setAttribute('stroke-width', '8');
        svg.appendChild(bgCircle);

        if (percentage > 0) {
            // Progress arc
            const angle = (percentage / 100) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${x} ${y}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '8');
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
        }

        // Add percentage text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '24');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(percentage)}%`;
        svg.appendChild(text);

        container.appendChild(svg);
        return svg;
    }
}

// Chart data utilities
class ChartDataUtils {
    // Group data by date
    static groupByDate(data, dateField = 'date') {
        const grouped = {};
        data.forEach(item => {
            const date = new Date(item[dateField]).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });
        return grouped;
    }

    // Calculate average values
    static calculateAverage(data, valueField = 'value') {
        if (data.length === 0) return 0;
        const sum = data.reduce((total, item) => total + item[valueField], 0);
        return sum / data.length;
    }

    // Calculate percentage change
    static calculatePercentageChange(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    // Format chart data
    static formatForChart(data, labelField, valueField) {
        return data.map(item => ({
            label: item[labelField],
            value: item[valueField]
        }));
    }
}

