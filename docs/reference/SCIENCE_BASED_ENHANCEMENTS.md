# Science-Based Feature Enhancements

Perfect foundation! Here's how to integrate the science-based insights into your existing architecture:

## Navigation Structure & Feature Placement

### Current Navigation Groups:
1. **Planning** - Projects, Notes, Todos, Timelines, Reports
2. **Growth** - Skills, Achievements, Reflections, Learning
3. **Wellbeing** - Mood, Workload, Gratitude, AI Coaching
4. **Settings** (standalone)

### Recommended Feature Placement:

#### **Wellbeing Section** (add new items):
- **Energy Tracker** - 90-min ultradian rhythm check-ins & heatmap visualization
  - Icon: `<i class="fas fa-bolt"></i>` or `<i class="fas fa-battery-three-quarters"></i>`
- **Sleep Log** - Bedtime consistency & sleep quality tracking
  - Icon: `<i class="fas fa-moon"></i>` or `<i class="fas fa-bed"></i>`

#### **Growth Section** (add new item):
- **Habits** - Implementation intention-based habit tracker
  - Icon: `<i class="fas fa-check-circle"></i>` or `<i class="fas fa-calendar-check"></i>`

#### **Planning Section** (enhancement to existing):
- **Todos** - Add cognitive load indicators to existing todo module
  - No new nav item needed - enhance existing Todos tab
  - Add visual indicators (light/medium/heavy badges) to task list

#### **Growth Section** (enhancement to existing):
- **Achievements** - Expand existing achievements with gamification layer
  - No new nav item needed - enhance existing Achievements tab
  - Add rarity tiers and recovery badges

### Navigation Order Recommendation:

**Wellbeing Section** (updated order):
```html
<button class="nav-tab" data-tab="mood">
  <i class="fas fa-smile"></i> Mood
</button>
<button class="nav-tab" data-tab="energy">
  <i class="fas fa-bolt"></i> Energy
</button>
<button class="nav-tab" data-tab="workload">
  <i class="fas fa-clock"></i> Workload
</button>
<button class="nav-tab" data-tab="sleep">
  <i class="fas fa-moon"></i> Sleep
</button>
<button class="nav-tab" data-tab="gratitude">
  <i class="fas fa-heart"></i> Gratitude
</button>
<button class="nav-tab" data-tab="coaching">
  <i class="fas fa-robot"></i> AI Coaching
</button>
```

**Growth Section** (updated order):
```html
<button class="nav-tab" data-tab="skills">
  <i class="fas fa-brain"></i> Skills
</button>
<button class="nav-tab" data-tab="habits">
  <i class="fas fa-calendar-check"></i> Habits
</button>
<button class="nav-tab" data-tab="achievements">
  <i class="fas fa-trophy"></i> Achievements
</button>
<button class="nav-tab" data-tab="reflections">
  <i class="fas fa-mirror"></i> Reflections
</button>
<button class="nav-tab" data-tab="learning">
  <i class="fas fa-graduation-cap"></i> Learning
</button>
```

---

## 1. Energy & Ultradian Rhythm Tracking (New Module)
**Location: Wellbeing → Energy**

Add to your mood tracking:

```javascript
// Database schema addition
energy_logs: {
  timestamp,
  energy_level (1-5),
  cognitive_clarity (1-5),
  time_since_break (minutes)
}
```

### UI Implementation:
- Quick check-in widget (every 90 min notification)
- Heatmap view showing your peak/trough hours over weeks
- Claude analyzes patterns: "You consistently crash at 14:30—schedule deep work before lunch"

**Action:** When energy < 3, auto-suggest break. When adding todos, AI suggests optimal time slots based on your historical energy data.

## 2. Enhanced Todo: Cognitive Load Scoring
**Location: Planning → Todos (enhancement to existing)**

Extend your existing todo module:

```javascript
// Add to todo schema
cognitive_weight: 'light' | 'medium' | 'heavy',
estimated_decision_count: number,
context: 'focus' | 'admin' | 'social'
```

### Claude enhancement:
- Auto-classify task weight when AI generates suggestions
- Daily dashboard shows: "Today's cognitive budget: 3 heavy tasks recommended (you have 5 scheduled)"
- Batch similar contexts together
- Flag overloaded days before they happen

## 3. Habit Tracker with Implementation Intentions (New Module)
**Location: Growth → Habits**

```javascript
habits: {
  habit_name,
  trigger_type: 'time' | 'location' | 'after_action',
  trigger_value: string,
  minimum_action: string,  // The "tiny" version
  full_action: string,
  current_streak,
  weekly_consistency_target  // Not daily—allows flexibility
}
```

### Key difference from typical trackers:
- Focus on consistency (4/7 days) not perfection
- Start with minimum_action only for first 2 weeks
- Claude asks: "What will you do right before this habit?" (implementation intention)
- Link to existing actions: "After my morning coffee" vs abstract "8 AM"

## 4. Recovery Metrics in Workload Module
**Location: Wellbeing → Workload (enhancement to existing)**

Enhance your existing workload tracker:

```javascript
// Add to workload_logs
recovery_score (1-10),  // Subjective: "How recovered do you feel?"
sleep_quality_last_night (1-5),
stress_level (1-5)
```

### Smart scaling:
When recovery_score < 4 for 2+ consecutive days:
- Claude flags in morning report: "Low recovery detected—recommend light workload day"
- Auto-reschedule non-urgent heavy tasks
- Suggest which project to deprioritize

## 5. Sleep Foundation Module (New)
**Location: Wellbeing → Sleep**

Critical for everything else:

```javascript
sleep_logs: {
  bedtime,
  wake_time,
  consistency_score,  // How close to average bedtime
  quality (1-5),
  screen_time_before_bed (minutes)
}
```

### Integration points:
- Evening reminder: "Bedtime in 30 min—wrap up tasks"
- Morning AI report includes: "Bedtime consistency: 85% this week"
- Correlate sleep quality with next-day energy/productivity

## 6. Gamification Layer (Enhancement to existing)
**Location: Growth → Achievements (enhancement to existing)**

Don't reinvent—add to your existing progress tracking:

```javascript
achievements: {
  milestone_type,
  unlock_date,
  rarity: 'common' | 'rare' | 'legendary'
}
```

### Examples:
- "7-day consistency" (common)
- "Maintained energy >3 all week" (rare)
- "Completed heavy task during identified peak hours 5x" (legendary)

**Critical:** Allow "recovery badges" too—"Took rest day when needed" prevents toxic streak protection.

## 7. Weekly AI Reflection Enhancement
**Location: Wellbeing → AI Coaching (enhancement to existing) + Automated Email via Settings**

Enhance your existing AI Mentor with structured reflection:

Every Sunday evening, Claude generates:
- **Pattern Recognition:** "You accomplish 40% more on Tue/Wed—consider front-loading hard tasks"
- **Energy-Task Mismatch:** "You scheduled 3 heavy cognitive tasks during your 14:00 trough this week"
- **Recovery Trends:** Chart showing workload vs recovery score
- **Habit Progress:** Which triggers are working, which aren't
- **Next Week Optimization:** Pre-populated calendar suggestions

Auto-send via your existing SendGrid integration.

## 8. Context-Aware AI Task Routing
**Location: Backend Enhancement (no UI changes)**

Enhance your OpenRouter integration:

```javascript
// Route based on query type
if (quick_checkin || mood_log || habit_update) {
  model = "claude-3-5-haiku"  // Fast, cheap
} else if (weekly_reflection || complex_analysis) {
  model = "anthropic/claude-3.7-sonnet"  // Deep insights
}
```

Given your AI routing preference, this saves tokens and latency.

## Implementation Priority (DMAIC-style)

### Quick Wins (Week 1):
1. Add energy check-in to mood tracker (reuse existing UI)
2. Cognitive load scoring in todo module
3. Recovery score in workload tracker

### Medium Effort (Week 2-3):
4. Sleep tracking module
5. Enhanced weekly reflection automation
6. Habit tracker with implementation intentions

### Polish (Week 4):
7. Gamification layer
8. Heatmap visualizations for energy patterns
9. Predictive scheduling based on historical data

## Database Migration Example

```sql
-- Add to existing mood_tracking table
ALTER TABLE mood_logs ADD COLUMN energy_level INTEGER;
ALTER TABLE mood_logs ADD COLUMN cognitive_clarity INTEGER;

-- New habits table
CREATE TABLE habits (
  id INTEGER PRIMARY KEY,
  habit_name TEXT,
  trigger_type TEXT,
  trigger_value TEXT,
  minimum_action TEXT,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

---

**Note:** These enhancements build on your existing architecture and leverage your current AI integration to create a science-based productivity system tailored to your work at Evos Amsterdam.
