\# VEXTORGRID ECOSYSTEM INTEGRATION GUIDE  
\*\*Version:\*\* 1.0 (Gold Master Aligned)  
\*\*Status:\*\* Active Specs for V2.0 Development

\#\# 1\. BANNER BEDLAM (Ad Server)  
\*\*Role:\*\* External Ad Serving API  
\*\*Integration Type:\*\* REST API (JSON)

\#\#\# API Contract (Draft)  
\- \*\*Endpoint:\*\* \`GET https://api.bannerbedlam.com/v1/serve\`  
\- \*\*Headers:\*\* \`x-client-id: vextorgrid-web\`, \`x-user-role: {role}\`  
\- \*\*Parameters:\*\*  
  \- \`placement\`: 'feed\_shout' | 'feed\_report' | 'hud\_sponsor'  
  \- \`limit\`: 1

\#\#\# Injection Logic  
1\. \*\*Shout Feed:\*\* Insert 1 ad object after every 5th message item.  
2\. \*\*Field Reports:\*\* Insert 1 ad object after every 3rd public report card.  
3\. \*\*Targeting:\*\*  
   \- If \`user\_role \=== 'professional'\`, request \`category=trucking\` (Insurance, Fuel).  
   \- If \`user\_role \=== 'personal'\`, request \`category=general\`.

\---

\#\# 2\. CRYPTOSTREEMZ (Distribution)  
\*\*Role:\*\* Upstream Marketing Funnel  
\*\*Integration Type:\*\* Referral Code Logic (No shared DB)

\#\#\# Referral Logic  
\- \*\*Source:\*\* Users arrive via \`vextorgrid.com?ref=CS\_USER\_ID\`.  
\- \*\*Action:\*\*  
  1\. Capture \`ref\` param from URL.  
  2\. Store in \`localStorage\` ('referrer').  
  3\. On Sign-Up: Insert into \`vextor\_profiles.referred\_by\` column.  
\- \*\*Independence Rule:\*\* VextorGrid maintains its own \`referral\_code\` column. We do NOT query the CryptoStreemz database directly.  
