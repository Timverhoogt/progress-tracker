import { initializeDatabase } from './sqlite';
import dotenv from 'dotenv';

dotenv.config();

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const cleanupDuplicateProjects = async () => {
  const db = initializeDatabase();
  
  try {
    console.log('🔍 Scanning for duplicate projects...');
    
    // Get all projects
    const result = await db.query('SELECT * FROM projects ORDER BY created_at ASC');
    const projects: Project[] = result.rows;
    
    if (projects.length === 0) {
      console.log('ℹ️ No projects found.');
      return;
    }
    
    console.log(`📊 Found ${projects.length} total projects`);
    
    // Group projects by name and description to identify duplicates
    const projectGroups = new Map<string, Project[]>();
    
    projects.forEach(project => {
      const key = `${project.name}|${project.description || ''}`;
      if (!projectGroups.has(key)) {
        projectGroups.set(key, []);
      }
      projectGroups.get(key)!.push(project);
    });
    
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    
    for (const [key, projectGroup] of projectGroups) {
      if (projectGroup.length > 1) {
        duplicatesFound += projectGroup.length - 1;
        console.log(`\n🔍 Found ${projectGroup.length} duplicates for: "${projectGroup[0].name}"`);
        
        // Keep the oldest project (first in the sorted array)
        const keepProject = projectGroup[0];
        const duplicatesToRemove = projectGroup.slice(1);
        
        console.log(`✅ Keeping project: ${keepProject.id} (created: ${keepProject.created_at})`);
        
        // Remove duplicates
        for (const duplicate of duplicatesToRemove) {
          try {
            // Check if project has associated data
            const [notesResult, todosResult, reportsResult] = await Promise.all([
              db.query('SELECT COUNT(*) as count FROM notes WHERE project_id = ?', [duplicate.id]),
              db.query('SELECT COUNT(*) as count FROM todos WHERE project_id = ?', [duplicate.id]),
              db.query('SELECT COUNT(*) as count FROM reports WHERE project_id = ?', [duplicate.id])
            ]);
            
            const hasNotes = notesResult.rows[0].count > 0;
            const hasTodos = todosResult.rows[0].count > 0;
            const hasReports = reportsResult.rows[0].count > 0;
            
            if (hasNotes || hasTodos || hasReports) {
              console.log(`⚠️ Project ${duplicate.id} has associated data:`);
              if (hasNotes) console.log(`   - ${notesResult.rows[0].count} notes`);
              if (hasTodos) console.log(`   - ${todosResult.rows[0].count} todos`);
              if (hasReports) console.log(`   - ${reportsResult.rows[0].count} reports`);
              
              // Move data to the kept project
              await Promise.all([
                hasNotes ? db.query('UPDATE notes SET project_id = ? WHERE project_id = ?', [keepProject.id, duplicate.id]) : Promise.resolve(),
                hasTodos ? db.query('UPDATE todos SET project_id = ? WHERE project_id = ?', [keepProject.id, duplicate.id]) : Promise.resolve(),
                hasReports ? db.query('UPDATE reports SET project_id = ? WHERE project_id = ?', [keepProject.id, duplicate.id]) : Promise.resolve()
              ]);
              
              console.log(`📦 Moved associated data to kept project ${keepProject.id}`);
            }
            
            // Remove the duplicate project
            await db.query('DELETE FROM projects WHERE id = ?', [duplicate.id]);
            duplicatesRemoved++;
            console.log(`🗑️ Removed duplicate project: ${duplicate.id} (created: ${duplicate.created_at})`);
            
          } catch (error) {
            console.error(`❌ Error removing duplicate project ${duplicate.id}:`, error);
          }
        }
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Total projects scanned: ${projects.length}`);
    console.log(`   - Duplicate projects found: ${duplicatesFound}`);
    console.log(`   - Duplicate projects removed: ${duplicatesRemoved}`);
    console.log(`   - Unique projects remaining: ${projects.length - duplicatesRemoved}`);
    
    if (duplicatesRemoved > 0) {
      console.log(`✅ Successfully cleaned up ${duplicatesRemoved} duplicate projects!`);
    } else {
      console.log(`✅ No duplicate projects found - database is clean!`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupDuplicateProjects()
    .then(() => {
      console.log('🎉 Cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateProjects };