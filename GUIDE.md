# CompareToLearn — Version 1.0 Guide

**Live at:** http://77.42.90.240:3456

---

## What Is This?

CompareToLearn is a web app for **Adaptive Comparative Judgement (ACJ)** — but designed as a *learning tool*, not just an assessment tool.

The idea: when learners compare pieces of work and decide "which is better?", they develop **assessment literacy** — they learn to recognise quality. This is the core insight that makes ACJ powerful for learning, not just ranking.

---

## What Can You Do Right Now?

### As a Teacher:
1. **Create a task** — give it a title, subject, and success criteria
2. **Add artefacts** — paste in work samples (text for now)
3. **Get a share link** — send it to learners
4. **See rankings** — watch as judgements come in and work gets ranked

### As a Learner:
1. **Pick a task** — from the list or via a direct link
2. **Enter your name** — so we can track your progress
3. **Compare pairs** — see two pieces of work side by side
4. **Choose the better one** — and explain why (optional but encouraged)
5. **Keep going** — until you've compared all pairs

---

## Why Build It This Way?

### Starting with Daniel (Secondary Learner)
We chose the secondary learner persona (14-year-old Daniel) as our starting point because:
- **Clean interface** — not too simple (primary), not too complex (VET)
- **Text first** — easiest to build; proves the core mechanics work
- **Criteria visible** — learners can see what they're looking for
- **Reasoning capture** — builds the feedback data we'll need later

### What's Deliberately Simple
This is an MVP. We've kept things simple to:
1. **Validate the core loop** — does comparing work feel right?
2. **Test teacher workflow** — is creating tasks easy enough?
3. **Get real data** — start collecting judgements to see patterns

### What's Missing (On Purpose)
- **User accounts** — using localStorage for now (simpler)
- **Image/video upload** — text only for MVP
- **AI feedback synthesis** — needs judgement data first
- **Calibration dashboard** — coming in v2
- **Competence mapping** — future feature

---

## How to Test It

### Quick Teacher Test:
1. Go to http://77.42.90.240:3456
2. Click "I'm a Teacher"
3. Click "New Task"
4. Create a task:
   - **Title:** "Short Story Opening"
   - **Subject:** "English"
   - **Criteria:** "Engaging hook, clear setting, interesting characters, vivid description"
5. Add 4-5 artefacts (paste different story openings)
6. Copy the share link

### Quick Learner Test:
1. Go to the share link (or http://77.42.90.240:3456/judge)
2. Click "I'm a Learner"
3. Select the task
4. Enter your name
5. Start comparing!

---

## How to Continue Building (Vibecoding Guide)

You're working with me (the ACJ Builder agent). Here's how we iterate:

### The Pattern
1. **You react** — tell me what works, what doesn't, what's missing
2. **I build** — make changes, deploy, update the live app
3. **You test** — click around, try things, break things
4. **Repeat** — fast cycles, small changes

### What to Tell Me
- "The font is too small"
- "I want to see the criteria while judging"
- "Can learners see how many comparisons they've done?"
- "Add a button that does X"
- "This feels wrong because..."

### Next Features to Consider
Pick what matters most:

**Usability:**
- [ ] Mobile-responsive improvements
- [ ] Better artefact display (scrollable, zoomable)
- [ ] Progress indicator for learners
- [ ] Bulk artefact upload

**Data & Insights:**
- [ ] Export judgement data (CSV)
- [ ] See individual judge reasoning
- [ ] Basic reliability stats (inter-rater agreement)
- [ ] Judge calibration score

**Multi-Modal:**
- [ ] Image upload for artefacts
- [ ] Side-by-side image comparison
- [ ] URL embedding

**AI Features:**
- [ ] Synthesise feedback from reasoning patterns
- [ ] Auto-generate "look-fors" from criteria
- [ ] Suggest exemplars

---

## Technical Details (For Reference)

### Stack
- **Framework:** Next.js 16 (React, TypeScript)
- **Styling:** Tailwind CSS
- **Database:** SQLite (simple file-based, stored in `/data`)
- **Hosting:** PM2 process on this server

### File Structure
```
app/comparetolearn/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home page
│   │   ├── teacher/          # Teacher dashboard
│   │   ├── judge/            # Learner judging interface
│   │   └── api/              # Backend routes
│   └── lib/
│       └── db.ts             # Database + helpers
├── data/
│   └── comparetolearn.db     # SQLite database
└── GUIDE.md                  # This file
```

### Key Commands
```bash
# View logs
pm2 logs comparetolearn

# Restart the app
pm2 restart comparetolearn

# Rebuild after changes
cd /home/iris/clawd-acjbot/app/comparetolearn
npm run build
pm2 restart comparetolearn
```

### Database Schema
- **tasks** — id, title, subject, criteria, description
- **artefacts** — id, task_id, title, content, type
- **judgements** — id, task_id, artefact_a_id, artefact_b_id, chosen_id, reasoning, judge_id, time_taken_ms
- **judges** — id, name, role

---

## What's Next?

Tell me:
1. **What do you want to test first?**
2. **What's the most important missing feature?**
3. **Any immediate bugs or issues?**

I'll keep building. You keep reacting. That's the vibecoding way. 🚀

---

*Built by the ACJ Builder agent for Bantani Education*
*Version 1.0 — February 2026*
