import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

interface ExtractedInfo {
  email: string
  name: string | null
  company: string | null
}

/**
 * Use OpenAI to extract names and company info from a batch of emails.
 * Falls back gracefully if AI extraction fails.
 */
export async function extractContactInfo(
  emails: string[]
): Promise<ExtractedInfo[]> {
  if (!process.env.OPENAI_API_KEY) {
    // Return empty extractions if no API key configured
    return emails.map((email) => ({ email, name: null, company: null }))
  }

  try {
    // Process in batches of 50 to avoid token limits
    const batchSize = 50
    const results: ExtractedInfo[] = []

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchResults = await extractBatch(batch)
      results.push(...batchResults)
    }

    return results
  } catch (error) {
    console.error('OpenAI extraction failed:', error)
    return emails.map((email) => ({ email, name: null, company: null }))
  }
}

async function extractBatch(emails: string[]): Promise<ExtractedInfo[]> {
  const emailList = emails.join('\n')

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are an expert at extracting personal and business information from email addresses.
Given a list of email addresses, extract the most likely full name and company for each.
Rules:
- For names: Parse the local part (before @) using common patterns like firstname.lastname, first_last, etc.
- For companies: Use the domain name. Skip common free providers (gmail, yahoo, hotmail, outlook, etc).
- If you can't determine a name or company, use null.
- Return valid JSON only, no markdown.`,
      },
      {
        role: 'user',
        content: `Extract name and company from these emails. Return a JSON array of objects with "email", "name", and "company" fields:\n\n${emailList}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    return emails.map((email) => ({ email, name: null, company: null }))
  }

  try {
    const parsed = JSON.parse(content) as { results?: ExtractedInfo[] }
    const results = parsed.results || (Array.isArray(parsed) ? parsed : [])

    // Ensure we have a result for every email
    return emails.map((email) => {
      const found = results.find(
        (r: ExtractedInfo) => r.email?.toLowerCase() === email.toLowerCase()
      )
      return {
        email,
        name: found?.name || null,
        company: found?.company || null,
      }
    })
  } catch {
    return emails.map((email) => ({ email, name: null, company: null }))
  }
}
