# 📚 Progress Tracker Documentation Index

**Welcome to the documentation hub!** This page helps you navigate all documentation for the Progress Tracker application.

> **Getting Started?** See the main [`README.md`](../README.md) in the project root for:
> - What this application does
> - Quick setup instructions
> - Feature overview
> - Basic usage guide

**This documentation index** organizes detailed guides by topic for developers and maintainers.

---

## 🗂️ Documentation Structure

### Active Documentation

#### Database
- **[`DATABASE.md`](../DATABASE.md)** ⭐ **Primary database guide** - Complete reference for all database operations
  - Database location and technology (SQLite)
  - Restore from SQL exports
  - Backup procedures (manual and automated)
  - Data persistence through Docker
  - Troubleshooting and maintenance

- **[`database/`](database/)** - Database-specific guides
  - [`database-scripts.md`](database/database-scripts.md) - Utility scripts documentation
  - [`DATABASE_EXPORT_README.md`](database/DATABASE_EXPORT_README.md) - About database_export.sql file

#### Testing
- **[`testing/`](testing/)** - Testing documentation
  - [`VSCODE_TESTING_GUIDE.md`](testing/VSCODE_TESTING_GUIDE.md) - VSCode testing setup
  - [`VSCODE_TESTING_TROUBLESHOOTING.md`](testing/VSCODE_TESTING_TROUBLESHOOTING.md) - Common issues
  - [`SETUP_VSCODE_TESTING.md`](testing/SETUP_VSCODE_TESTING.md) - Initial setup guide
  - [`TESTING_SUMMARY.md`](testing/TESTING_SUMMARY.md) - Overview of test coverage

#### Reference
- **[`reference/`](reference/)** - Historical and reference documentation
  - [`cleanup-summary-2025-10-06.md`](reference/cleanup-summary-2025-10-06.md) - Database restoration record
  - [`AI_DEVELOPMENT_PLAN.md`](reference/AI_DEVELOPMENT_PLAN.md) - AI feature roadmap
  - [`SCIENCE_BASED_ENHANCEMENTS.md`](reference/SCIENCE_BASED_ENHANCEMENTS.md) - Evidence-based features
  - [`TIMELINE_IMPROVEMENTS.md`](reference/TIMELINE_IMPROVEMENTS.md) - Timeline feature enhancements

### Archived Documentation

**[`archive/`](archive/)** - Superseded documentation kept for historical reference

These documents have been replaced by the consolidated DATABASE.md guide:
- SQLITE_MIGRATION.md - PostgreSQL to SQLite migration (completed)
- DATA_PERSISTENCE_GUIDE.md - Docker persistence (outdated, had inaccuracies)
- BACKUP_README.md - Backup procedures (integrated into DATABASE.md)
- DATABASE_RESTORE_GUIDE.md - Restore procedures (integrated into DATABASE.md)
- DATABASE_DOCUMENTATION_TIMELINE.md - Analysis of documentation evolution

See [`archive/README.md`](archive/README.md) for details.

---

## 📖 Quick Reference

### Database Operations
**Primary guide:** [`DATABASE.md`](../DATABASE.md)

```bash
# Check database contents
cd backend && npx ts-node check-db.ts

# Create backup
./backup.sh  # Linux/Mac
backup.bat   # Windows

# Database location
backend/data/progress_tracker.db
```

### Testing
**Primary guides:** [`testing/`](testing/) directory

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests  
cd frontend && npm test
```

### Development
**Primary guide:** [`README.md`](../README.md)

```bash
# Start application
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

---

## 🔍 Finding Information

| Topic | Document |
|-------|----------|
| Database setup & operations | [`DATABASE.md`](../DATABASE.md) |
| Application setup | [`README.md`](../README.md) |
| Testing setup | [`testing/VSCODE_TESTING_GUIDE.md`](testing/VSCODE_TESTING_GUIDE.md) |
| Database utilities | [`database/database-scripts.md`](database/database-scripts.md) |
| Historical changes | [`reference/cleanup-summary-2025-10-06.md`](reference/cleanup-summary-2025-10-06.md) |
| Deprecated PostgreSQL | [`../database/README.md`](../database/README.md) |
| AI features roadmap | [`reference/AI_DEVELOPMENT_PLAN.md`](reference/AI_DEVELOPMENT_PLAN.md) |

---

## 📝 Documentation Standards

- **Active docs** live in root or organized subdirectories
- **Archived docs** go to `docs/archive/` with explanation
- **All archives** include README explaining why superseded
- **Primary references** marked with ⭐ in documentation
- **Cross-references** use relative links for portability

---

## 🤝 Contributing to Documentation

When updating documentation:

1. ✅ Update the primary reference document
2. ✅ Add cross-references where relevant
3. ✅ Archive old versions if creating new consolidated guides
4. ✅ Update this README if adding new documentation categories
5. ✅ Keep README.md in project root focused on getting started

---

## 🔗 Relationship Between READMEs

| File | Purpose | Audience |
|------|---------|----------|
| [`README.md`](../README.md) (root) | **Project overview & getting started** | New users, quick setup |
| [`docs/README.md`](README.md) (this file) | **Documentation navigation & organization** | Developers, detailed guides |
| [`DATABASE.md`](../DATABASE.md) | **Complete database reference** | Anyone working with data |

**Flow:** Start with root README → Use docs/README for specific topics → Dive into detailed guides

---

**Last Updated:** October 6, 2025
**Status:** Active and maintained