# Lessons Learned

This document captures important patterns, preferences, and project intelligence gained during development.

## General Learnings:
- **File Verification:** Always verify the existence and content of files before attempting to modify them, especially when dealing with configuration or memory files.
- **Tool Selection:** Choose the correct tool for the task at hand, considering the specific requirements of each tool (e.g., `write_to_file` vs. `apply_diff`).
- **Supabase Environment Variables:** Ensure `.env.local` variables are on a single line to avoid parsing errors with Supabase CLI tools.
- **Next.js Build Cache:** For persistent development issues, especially related to static assets or client-side logic, a clean rebuild (deleting `.next`, `node_modules`, `package-lock.json`, reinstalling, and restarting dev server) can resolve underlying build problems.

## Project-Specific Patterns:
- (To be added as project progresses)