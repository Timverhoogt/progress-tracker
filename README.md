# 📊 Progress Tracker - Tim Verhoogt @ Evos Amsterdam

A powerful AI-enhanced personal progress tracking application designed for continuous improvement projects in petrochemical storage operations.

## 🚀 Features

### 📝 Diary-Style Note Taking
- **Easy Input**: Write thoughts, observations, and progress updates in natural language
- **AI Enhancement**: Automatic structuring and enhancement of notes using Claude 3.5 Sonnet
- **Smart Extraction**: AI identifies key insights, action items, risks, and opportunities
- **Project Context**: Notes are automatically organized by project with relevant context

### 🎯 Smart Todo Management
- **Manual Tasks**: Create and manage tasks with priorities and due dates
- **AI Suggestions**: Generate contextual todo items based on project notes and context
- **Progress Tracking**: Mark tasks as completed and track project momentum
- **Priority Management**: Organize tasks by priority (high, medium, low)

### 📈 Professional Reports
- **Status Reports**: For management and stakeholders
- **Project Summaries**: Comprehensive documentation suitable for handovers
- **Stakeholder Reports**: Business-focused communications highlighting impact
- **Auto-Generation**: AI creates professional reports from your notes and progress

### 🔧 Project Management
- **Project Organization**: Manage multiple continuous improvement projects
- **Status Tracking**: Monitor project phases (active, on hold, completed, archived)
- **Context Awareness**: AI understands your role at Evos Amsterdam and industry context

## 🏗️ Architecture

- **Frontend**: Modern web interface (HTML/CSS/JavaScript)
- **Backend**: Node.js/TypeScript with Express API
- **Database**: SQLite with local file storage (no external database needed)
- **AI Integration**: OpenRouter API with Claude 3.5 Sonnet
- **Infrastructure**: Docker containers for easy deployment

## 🛠️ Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- OpenRouter API account and key
- No external database required (SQLite included)

### Quick Start

1. **Clone and Configure**
   ```bash
   cd progress-tracker
   cp .env .env.local
   # Edit .env.local with your configuration
   ```

2. **Required Environment Variables**
   ```bash
   # Edit .env.local
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   SQLITE_DB_PATH=./data/progress_tracker.db
   SITE_URL=https://tracker.evosgpt.eu
   ```

3. **Build and Start**
   ```bash
   docker-compose up -d --build
   ```

4. **Access Your Application**
   - Frontend: http://localhost:8080 (Password protected)
   - Backend API: http://localhost:3060
   - Database: SQLite file stored locally

### 🔐 Authentication

The application is password protected for security when exposing to the internet:

**Login Credentials:**
- Username: `tim.verhoogt`
- Password: `Evos2025!`

**Database Details:**
- SQLite local file database
- No external database administration needed
- Built-in backup and restore utilities

### Production Deployment (Docker)

1. **Update Environment**
   ```bash
   # Production .env
   NODE_ENV=production
   SITE_URL=https://tracker.evosgpt.eu
   FRONTEND_URL=https://tracker.evosgpt.eu
   # Use secure passwords and your domain
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Nginx/Cloudflare Configuration**
   The application is designed to work behind nginx proxy with Cloudflare:
   - Frontend container exposes port 80
   - Backend container exposes port 3060
   - Configure your nginx to proxy to these containers
   - Set up SSL/TLS through Cloudflare

## 📋 Usage Guide

### Getting Started

1. **Create Your First Project**
   - Click "New Project" on the Projects tab
   - Enter project name (e.g., "ML Terminal Time Prediction - Terneuzen")
   - Add a description of your goals and context

2. **Add Notes (Diary Style)**
   - Select your project in the Notes tab
   - Write freely about your observations, progress, challenges
   - Click "Add & Enhance Note" to let AI structure your content
   - View enhanced notes with extracted insights and action items

3. **Manage Tasks**
   - Switch to Todos tab
   - Add manual tasks or use "AI Suggestions" for contextual recommendations
   - Set priorities and due dates
   - Mark tasks complete as you progress

4. **Generate Reports**
   - Use the Reports tab to create professional communications
   - Choose report type based on audience:
     - **Status Report**: For your manager or operations team
     - **Project Summary**: For documentation or handovers
     - **Stakeholder Report**: For business impact communications
   - Specify recipient for tailored content

### AI Features

- **Note Enhancement**: Your diary entries are automatically enhanced with professional language while preserving your original meaning
- **Insight Extraction**: AI identifies key insights, risks, opportunities, and stakeholders
- **Smart Todos**: AI suggests relevant next steps based on your project context and recent progress
- **Professional Reports**: Generate polished reports suitable for management and stakeholders

## 🔒 Security & Privacy

- All data stored locally in SQLite database file
- OpenRouter API calls are made server-side only
- No data persistence on external AI services beyond API calls
- Designed for your private infrastructure with password protection
- Easy database backup and migration with single file storage

## 🎯 Perfect For

- **Continuous Improvement Projects** at Evos Amsterdam
- **ML Model Testing** and deployment tracking
- **Stakeholder Engagement** documentation
- **Performance Monitoring** dashboard development
- **Terminal Operations** optimization projects
- **Customer Service Integration** initiatives

## 🚀 Advanced Features

### API Integration
The backend provides a full REST API for integration with other tools:
- `/api/projects` - Project management
- `/api/notes` - Note creation and retrieval
- `/api/todos` - Task management
- `/api/reports` - Report generation
- `/api/llm` - Direct AI enhancement endpoints

### Monitoring & Health Checks
- Built-in health checks for all containers
- Application monitoring endpoints
- Database connection status
- AI service availability checks

## 📞 Support

This application was custom-built for Tim Verhoogt's continuous improvement work at Evos Amsterdam. The system is designed to understand the petrochemical storage industry context and continuous improvement methodologies.

### Key Benefits for Evos Amsterdam

1. **Industry-Aware AI**: Understands petrochemical terminal operations
2. **Professional Communications**: Generate reports suitable for management
3. **Progress Documentation**: Track improvement initiatives systematically
4. **Knowledge Capture**: Preserve insights and lessons learned
5. **Stakeholder Engagement**: Create compelling progress communications

---

**Built with ❤️ for continuous improvement at Evos Amsterdam**

*Designed to enhance Tim Verhoogt's analytical work and improvement initiatives across petrochemical storage operations.*
