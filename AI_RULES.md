\# AI DEVELOPMENT RULES (STRICT)  
\*\*Context:\*\* VextorGrid V1.0 (Build 87\)  
\*\*Owner:\*\* Brian  
\*\*Enforcement:\*\* Strict adherence required. Do not deviate without permission.

\#\# 1\. THE "ONE TRUCK" WORKFLOW RULE (CRITICAL)  
\* \*\*Single Server Policy:\*\* Never suggest running \`npm run dev\` if another local server (Bolt or Kilo) might be active.  
\* \*\*Resource Defense:\*\* If the environment seems sluggish, suggest a "Laptop Reboot" before continuing.  
\* \*\*File Locks:\*\* If a file cannot be written, assume it is locked by a background process. Do not force-write; suggest checking running tasks.

\#\# 2\. TECH STACK CONSTRAINTS  
\* \*\*Framework:\*\* React 18.3.1 (Vite).  
\* \*\*Language:\*\* TypeScript 5.9.3 (Strict Mode).  
\* \*\*Styling:\*\* Tailwind CSS 3.4.19.  
    \* \*Rule:\* Do NOT install \`styled-components\`, \`bootstrap\`, or \`material-ui\`. Use \`lucide-react\` for icons.  
\* \*\*Backend:\*\* Supabase (PostgreSQL \+ Auth \+ Edge Functions).  
    \* \*Rule:\* All database queries must respect RLS (Row Level Security).  
\* \*\*State:\*\* React Context API \+ Custom Hooks (\`useAuth\`, \`useFinancials\`).  
\* \*\*Math:\*\* Use \`numeric\` types carefully. For currency, prefer \`decimal\` in SQL and handle floating-point precision in JS specifically.

\#\# 3\. NETLIFY & DEPLOYMENT SAFETY  
\* \*\*Immutable Config:\*\* Do NOT modify \`netlify.toml\` unless fixing a specific build error.  
\* \*\*SPA Routing:\*\* Ensure all new pages are compatible with the redirect rule: \`from \= "/\*" to \= "/index.html"\`.  
\* \*\*No "Server" Code:\*\* This is a Client-Side SPA. Do not attempt to run Node.js server code (Express/Fastify) inside the \`src/\` folder. Use Supabase Edge Functions for server-side logic.

\#\# 4\. CODING STANDARDS  
\* \*\*Files:\*\* Use \`.tsx\` for components and \`.ts\` for logic.  
\* \*\*Imports:\*\* Use absolute paths where possible (e.g., \`@/components/...\`).  
\* \*\*Exports:\*\* Prefer named exports (\`export const Button \= ...\`) over default exports.  
\* \*\*Comments:\*\* Add JSDoc comments to complex logic (especially the Net Profit Engine in \`MasterActivityLedger.tsx\`).

\#\# 5\. ECOSYSTEM AWARENESS  
\* \*\*Banner Bedlam:\*\* Implemented as an \*external API call\*. Do not hardcode ad logic.  
\* \*\*CryptoStreemz:\*\* VextorGrid is \*standalone\*. Do not try to import CryptoStreemz user tables.  
\* \*\*Gamification:\*\* Always check \`if (gamificationEnabled)\` before rendering Flux points or Ranks.

\#\# 6\. WHEN IN DOUBT...  
\* \*\*Stop and Ask:\*\* If a request conflicts with the "Gold Master" Dossier, ask Brian for clarification before writing code.  
\* \*\*Check the Map:\*\* Refer to \`PROJECT\_DOSSIER.md\` Appendix A to find the correct file path.  
