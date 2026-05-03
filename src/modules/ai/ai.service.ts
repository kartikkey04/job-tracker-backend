import { createHash } from 'crypto';
import { getOrSetCache } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';

const CACHE_TTL = 60 * 60 * 24; // 24 hours

// Simple hash for cache keys
const hashContent = (content: string): string =>
  createHash('md5').update(content).digest('hex');

// Call OpenAI API
// const callOpenAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
//   if (!env.OPENAI_API_KEY) {
//     throw new AppError('OpenAI API key not configured', 503);
//   }

//   const response = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: 'gpt-4o-mini', // cost-efficient model
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt },
//       ],
//       temperature: 0.7,
//       max_tokens: 1500,
//     }),
//   });

//   if (!response.ok) {
//     const err = await response.json() as { error?: { message?: string } };
//     throw new AppError(err?.error?.message ?? 'OpenAI API error', 502);
//   }

//   const data = await response.json() as {
//     choices: Array<{ message: { content: string } }>;
//   };
//   return data.choices[0].message.content;
// };


const callGroq = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  if (!env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 503);
  }

  // Groq uses OpenAI-compatible API — same structure, different base URL
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // best free model on Groq
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } };
    throw new AppError(err?.error?.message ?? 'Groq API error', 502);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
};

export const generateCoverLetter = async (
  jobDescription: string,
  roleTitle: string,
  companyName: string
): Promise<{ variants: { formal: string; conversational: string; concise: string } }> => {
  const cacheKey = `cover:${hashContent(jobDescription + roleTitle + companyName)}`;

  return getOrSetCache(cacheKey, CACHE_TTL, async () => {
    const systemPrompt = `You are an expert career coach who writes outstanding cover letters.
Always respond with a JSON object containing three keys: "formal", "conversational", and "concise".
Each value is a complete cover letter variant. No extra text outside the JSON.`;

    const userPrompt = `Write 3 cover letter variants for this role:
Company: ${companyName}
Role: ${roleTitle}
Job Description: ${jobDescription.slice(0, 2000)}

Return JSON with keys: formal, conversational, concise.`;

    const raw = await callGroq(systemPrompt, userPrompt);

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned) as { variants: { formal: string; conversational: string; concise: string } };
    } catch {
      return { variants: { formal: raw, conversational: raw, concise: raw } };
    }
  });
};

export const generateInterviewTips = async (
  jobDescription: string,
  roleTitle: string,
  companyName: string
): Promise<{ tips: string[]; likely_questions: string[]; research_points: string[] }> => {
  const cacheKey = `tips:${hashContent(jobDescription + roleTitle + companyName)}`;

  return getOrSetCache(cacheKey, CACHE_TTL, async () => {
    const systemPrompt = `You are an expert interview coach. Return ONLY valid JSON, no extra text.`;

    const userPrompt = `Prepare interview tips for:
Company: ${companyName}
Role: ${roleTitle}
Job Description: ${jobDescription.slice(0, 2000)}

Return JSON with: tips (array of 5 tips), likely_questions (array of 8 questions), research_points (array of 5 things to research).`;

    const raw = await callGroq(systemPrompt, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as { tips: string[]; likely_questions: string[]; research_points: string[] };
  });
};

export const matchResume = async (
  resumeText: string,
  jobDescription: string
): Promise<{ match_score: number; matched_keywords: string[]; missing_keywords: string[]; suggestions: string[] }> => {
  const cacheKey = `match:${hashContent(resumeText + jobDescription)}`;

  return getOrSetCache(cacheKey, CACHE_TTL, async () => {
    const systemPrompt = `You are an ATS and resume expert. Return ONLY valid JSON, no extra text.`;

    const userPrompt = `Analyse this resume against the job description:

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return JSON with:userPrompt
- match_score: number 0-100
- matched_keywords: array of keywords found in both
- missing_keywords: array of important keywords from JD missing in resume
- suggestions: array of 5 specific improvement suggestions`;

    const raw = await callGroq(systemPrompt, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as { match_score: number; matched_keywords: string[]; missing_keywords: string[]; suggestions: string[] };
  });
};
