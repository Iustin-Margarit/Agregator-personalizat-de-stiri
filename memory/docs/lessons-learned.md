# Lessons Learned

This document captures important patterns, preferences, and project intelligence gained during development.

## General Learnings:
- **File Verification:** Always verify the existence and content of files before attempting to modify them, especially when dealing with configuration or memory files.
- **Tool Selection:** Choose the correct tool for the task at hand, considering the specific requirements of each tool (e.g., `write_to_file` vs. `apply_diff`).
- **Supabase Environment Variables:** Ensure `.env.local` variables are on a single line to avoid parsing errors with Supabase CLI tools.
- **Next.js Build Cache:** For persistent development issues, especially related to static assets or client-side logic, a clean rebuild (deleting `.next`, `node_modules`, `package-lock.json`, reinstalling, and restarting dev server) can resolve underlying build problems.

## Project-Specific Patterns:

### News Feed Filtering System:
- **Multi-Filter Design:** Implementing multiple filter types (category, search, date, source) requires careful state management to ensure all filters work together seamlessly
- **Database-Level Filtering:** Apply all filtering logic at the database level (Supabase) rather than in JavaScript for optimal performance
- **Debounced Search:** Use 300ms debouncing for search input to balance responsiveness with reduced API calls
- **Filter State Management:** Each filter type needs its own state and handler, with all handlers calling the same central `fetchFilteredArticles` function
- **Source Grouping:** Organize sources by category in the UI for better user experience and easier selection
- **Date Range UX:** Use relative ranges ("Last 7 Days") instead of calendar-based ranges ("This Week") to ensure articles are always available
- **Filter Integration:** When implementing new filter types, ensure they integrate with pagination (`loadMoreArticles`) and existing filter logic

### Supabase Relationship Handling:
- **Flexible Category Mapping:** When fetching related data, handle both object and array formats since Supabase can return either depending on the relationship
- **Null Source Cleanup:** Regularly clean up articles with null `source_id` values to prevent "Unknown" category display issues
- **Proper Joins:** Use Supabase's nested select syntax to efficiently fetch related data (categories via sources) in a single query

### React Performance Patterns:
- **Memoized Components:** Use `memo()` for article cards and other components that render in lists to prevent unnecessary re-renders
- **Callback Dependencies:** Carefully manage `useCallback` dependencies, especially when adding new filter states
- **Virtualization:** For large lists, implement virtualization with proper visible range calculations based on screen size and scroll position

### State Management Best Practices:
- **Clear State Updates:** When filters change, always reset pagination offset and hasMore state to prevent stale data
- **Loading States:** Provide separate loading states for different operations (filter changes vs pagination) for better UX
- **Filter Persistence:** Consider which filter states should persist across page refreshes (category preferences) vs reset (search, date, source)

### Like Functionality & Analytics Implementation:
- **PowerShell Syntax:** Use semicolons (`;`) instead of `&&` for command chaining in PowerShell on Windows
- **Supabase Port Conflicts:** Windows has reserved port ranges (49152-65535) that can conflict with default Supabase ports. Use alternative ports (58321+) when needed
- **Analytics Architecture:** Simple analytics can be effectively stored in JSONB columns for MVP features rather than requiring complex analytics services
- **Optimistic UI Updates:** Always implement proper error handling with state reversion for optimistic UI updates in engagement features
- **Database Migration Management:** Use `npx supabase db push` to apply migrations incrementally, not `db reset` which would destroy existing data
- **Event Tracking:** Track engagement events (likes/unlikes) immediately after successful database operations to ensure data consistency
- **Privacy-First Analytics:** Store analytics data in user's own profile record rather than separate analytics tables for better privacy compliance
- **JSONB Performance:** Use GIN indexes on JSONB columns containing analytics data for better query performance