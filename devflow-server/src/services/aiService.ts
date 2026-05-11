import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateApiCall(description: string): Promise<{
  method: string
  url: string
  headers: Record<string, string>
  body: string
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an API configuration generator. 
          Given a description, return ONLY a JSON object with these exact fields:
          {
            "method": "GET|POST|PUT|DELETE|PATCH",
            "url": "full url with https://",
            "headers": { "key": "value" },
            "body": "JSON string or empty string"
          }
          No explanation. No markdown. Just the JSON object.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.warn('OpenAI API failed (likely quota exceeded). Using local heuristic fallback.')
    
    // Heuristic fallback so it reacts to the prompt without needing a working API key
    const lower = description.toLowerCase()
    
    let method = 'GET'
    if (lower.includes('post') || lower.includes('create') || lower.includes('add')) method = 'POST'
    else if (lower.includes('put') || lower.includes('update')) method = 'PUT'
    else if (lower.includes('delete') || lower.includes('remove')) method = 'DELETE'

    let url = 'https://jsonplaceholder.typicode.com/posts'
    if (lower.includes('user')) url = 'https://jsonplaceholder.typicode.com/users'
    else if (lower.includes('comment')) url = 'https://jsonplaceholder.typicode.com/comments'
    else if (lower.includes('todo')) url = 'https://jsonplaceholder.typicode.com/todos'
    else if (lower.includes('album')) url = 'https://jsonplaceholder.typicode.com/albums'

    // Add ID if it's a specific action
    if (method === 'PUT' || method === 'DELETE' || lower.includes('specific') || lower.includes(' by id')) {
      url += '/1'
    }

    let body = ''
    if (method === 'POST' || method === 'PUT') {
      body = JSON.stringify({ name: "Test Item", data: "Sample data from AI fallback" }, null, 2)
    }

    return {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    }
  }
}

export async function fixApiCall(error: string, config: any): Promise<{
  method: string
  url: string
  headers: Record<string, string>
  body: string
  explanation?: string
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert API debugger. 
          The user has an API call that failed.
          You must fix their configuration based on the error message.
          Return ONLY a JSON object with these exact fields:
          {
            "method": "GET|POST|PUT|DELETE|PATCH",
            "url": "full url with https://",
            "headers": { "key": "value" },
            "body": "JSON string or empty string",
            "explanation": "A very short 1-sentence explanation of what you fixed"
          }
          No explanation text outside the JSON. No markdown backticks. Just the raw JSON object.`,
        },
        {
          role: 'user',
          content: `Current Config: ${JSON.stringify(config)}\n\nError Message: ${error}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('OpenAI API failed. Returning original config.')
    return config // fallback to returning the same config if AI fails
  }
}