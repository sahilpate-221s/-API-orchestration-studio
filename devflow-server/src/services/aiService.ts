// import OpenAI from 'openai'

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// export async function generateApiCall(description: string): Promise<{
//   method: string
//   url: string
//   headers: Record<string, string>
//   body: string
// }> {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content: `You are an API configuration generator. 
//           Given a description, return ONLY a JSON object with these exact fields:
//           {
//             "method": "GET|POST|PUT|DELETE|PATCH",
//             "url": "full url with https://",
//             "headers": { "key": "value" },
//             "body": "JSON string or empty string"
//           }
//           No explanation. No markdown. Just the JSON object.`,
//         },
//         {
//           role: 'user',
//           content: description,
//         },
//       ],
//       temperature: 0.3,
//       max_tokens: 500,
//     })

//     const raw = completion.choices[0].message.content ?? '{}'
//     const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
//     return JSON.parse(cleaned)
//   } catch (error) {
//     console.warn('OpenAI API failed (likely quota exceeded). Using local heuristic fallback.')
    
//     // Heuristic fallback so it reacts to the prompt without needing a working API key
//     const lower = description.toLowerCase()
    
//     let method = 'GET'
//     if (lower.includes('post') || lower.includes('create') || lower.includes('add')) method = 'POST'
//     else if (lower.includes('put') || lower.includes('update')) method = 'PUT'
//     else if (lower.includes('delete') || lower.includes('remove')) method = 'DELETE'

//     let url = 'https://jsonplaceholder.typicode.com/posts'
//     if (lower.includes('user')) url = 'https://jsonplaceholder.typicode.com/users'
//     else if (lower.includes('comment')) url = 'https://jsonplaceholder.typicode.com/comments'
//     else if (lower.includes('todo')) url = 'https://jsonplaceholder.typicode.com/todos'
//     else if (lower.includes('album')) url = 'https://jsonplaceholder.typicode.com/albums'

//     // Add ID if it's a specific action
//     if (method === 'PUT' || method === 'DELETE' || lower.includes('specific') || lower.includes(' by id')) {
//       url += '/1'
//     }

//     let body = ''
//     if (method === 'POST' || method === 'PUT') {
//       body = JSON.stringify({ name: "Test Item", data: "Sample data from AI fallback" }, null, 2)
//     }

//     return {
//       method,
//       url,
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       },
//       body
//     }
//   }
// }

// export async function fixApiCall(error: string, config: any): Promise<{
//   method: string
//   url: string
//   headers: Record<string, string>
//   body: string
//   explanation?: string
// }> {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         {
//           role: 'system',
//           content: `You are an expert API debugger. 
//           The user has an API call that failed.
//           You must fix their configuration based on the error message.
//           Return ONLY a JSON object with these exact fields:
//           {
//             "method": "GET|POST|PUT|DELETE|PATCH",
//             "url": "full url with https://",
//             "headers": { "key": "value" },
//             "body": "JSON string or empty string",
//             "explanation": "A very short 1-sentence explanation of what you fixed"
//           }
//           No explanation text outside the JSON. No markdown backticks. Just the raw JSON object.`,
//         },
//         {
//           role: 'user',
//           content: `Current Config: ${JSON.stringify(config)}\n\nError Message: ${error}`,
//         },
//       ],
//       temperature: 0.2,
//       max_tokens: 500,
//     })

//     const raw = completion.choices[0].message.content ?? '{}'
//     const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
//     return JSON.parse(cleaned)
//   } catch (err) {
//     console.warn('OpenAI API failed. Returning original config.')
//     return config // fallback to returning the same config if AI fails
//   }
// }



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
    console.warn('OpenAI API failed. Using local heuristic fallback.')

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

    if (method === 'PUT' || method === 'DELETE' || lower.includes('specific') || lower.includes(' by id')) {
      url += '/1'
    }

    let body = ''
    if (method === 'POST' || method === 'PUT') {
      body = JSON.stringify({ name: 'Test Item', data: 'Sample data from AI fallback' }, null, 2)
    }

    return {
      method,
      url,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
    return config
  }
}

export async function generateWorkflow(description: string): Promise<{
  nodes: Array<{
    id: string
    type?: string
    label: string
    method?: string
    url?: string
    headers?: Record<string, string>
    body?: string
    sourcePath?: string
    operator?: string
    compareValue?: string
    trueLabel?: string
    falseLabel?: string
    position: { x: number; y: number }
  }>
  edges: Array<{
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
  }>
  explanation: string
}> {
  const systemPrompt = `You are a workflow generator for DevFlow, a visual API orchestration tool.

Given a description of what the user wants to do, generate a sequence of API nodes, condition nodes, and edges connecting them.

Return ONLY a valid JSON object with this exact structure:
{
  "nodes": [
    {
      "id": "node1",
      "type": "apiNode",
      "label": "Fetch User",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "url": "full https:// url",
      "headers": {},
      "body": "",
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "node2",
      "type": "conditionNode",
      "label": "Check Status",
      "sourcePath": "$.status",
      "operator": "eq|neq|gt|gte|lt|lte|contains|not_contains|exists|not_exists",
      "compareValue": "200",
      "trueLabel": "YES",
      "falseLabel": "NO",
      "position": { "x": 480, "y": 200 }
    }
  ],
  "edges": [
    { "source": "node1", "target": "node2" },
    { "source": "node2", "target": "node3", "sourceHandle": "true" },
    { "source": "node2", "target": "node4", "sourceHandle": "false" }
  ],
  "explanation": "One sentence describing what this workflow does"
}

Rules:
- Node type can be "apiNode" or "conditionNode". Default is "apiNode".
- Use "conditionNode" when the prompt involves conditional logic, checking response values, branching, if/else, or status validation.
- Condition nodes have TWO output handles: "true" (YES branch) and "false" (NO branch). Specify "sourceHandle": "true" or "sourceHandle": "false" on edges coming OUT of a condition node.
- Position nodes logically: first node x=100, next node x += 380.
- For IF/ELSE branching after a condition node:
  - Put condition node at x=480, y=200
  - Put the TRUE (YES) branch target node at x=860, y=100 (top)
  - Put the FALSE (NO) branch target node at x=860, y=340 (bottom)
- Generate 2 to 6 nodes maximum.
- Use real public APIs when possible (jsonplaceholder.typicode.com, reqres.in, httpbin.org, api.github.com)
- No explanation text outside the JSON. No markdown. Just the raw JSON object.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      throw new Error('Invalid workflow structure from AI')
    }

    return parsed

  } catch (error) {
    console.warn('OpenAI workflow generation failed. Using heuristic fallback.')

    const lower = description.toLowerCase()
    const nodes: any[] = []
    const edges: any[] = []

    const hasCondition = lower.includes('if') || lower.includes('condition') || lower.includes('check') || lower.includes('branch') || lower.includes('else') || lower.includes('when') || lower.includes('status')
    const hasUser = lower.includes('user')
    const hasPost = lower.includes('post') || lower.includes('article')
    const hasOrder = lower.includes('order')
    const hasWebhook = lower.includes('webhook') || lower.includes('notify') || lower.includes('send')
    const hasAuth = lower.includes('login') || lower.includes('auth')

    if (hasCondition) {
      // Create a 4-node IF/ELSE workflow template
      nodes.push({
        id: 'node1', type: 'apiNode', label: 'Fetch User',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1',
        headers: {}, body: '', position: { x: 100, y: 200 }
      })
      nodes.push({
        id: 'node2', type: 'conditionNode', label: 'Check User ID',
        sourcePath: '$.id', operator: 'eq', compareValue: '1',
        trueLabel: 'YES', falseLabel: 'NO',
        position: { x: 480, y: 200 }
      })
      nodes.push({
        id: 'node3', type: 'apiNode', label: 'Fetch User Posts (TRUE)',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts?userId=1',
        headers: {}, body: '', position: { x: 860, y: 100 }
      })
      nodes.push({
        id: 'node4', type: 'apiNode', label: 'Log Error (FALSE)',
        method: 'POST', url: 'https://httpbin.org/post',
        headers: { 'Content-Type': 'application/json' },
        body: '{"error": "User condition failed"}', position: { x: 860, y: 340 }
      })
      edges.push({ source: 'node1', target: 'node2' })
      edges.push({ source: 'node2', target: 'node3', sourceHandle: 'true' })
      edges.push({ source: 'node2', target: 'node4', sourceHandle: 'false' })
    } else if (hasAuth) {
      nodes.push({
        id: 'node1', type: 'apiNode', label: 'Login',
        method: 'POST', url: 'https://reqres.in/api/login',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email":"eve.holt@reqres.in","password":"cityslicka"}',
        position: { x: 100, y: 200 }
      })
      nodes.push({
        id: 'node2', type: 'apiNode', label: hasUser ? 'Get Users' : 'Get Profile',
        method: 'GET', url: 'https://reqres.in/api/users',
        headers: {}, body: '',
        position: { x: 480, y: 200 }
      })
      edges.push({ source: 'node1', target: 'node2' })
    } else if (hasUser && hasPost) {
      nodes.push({
        id: 'node1', type: 'apiNode', label: 'Fetch User',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1',
        headers: {}, body: '',
        position: { x: 100, y: 200 }
      })
      nodes.push({
        id: 'node2', type: 'apiNode', label: 'Fetch Posts',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts?userId=1',
        headers: {}, body: '',
        position: { x: 480, y: 200 }
      })
      edges.push({ source: 'node1', target: 'node2' })
      if (hasWebhook) {
        nodes.push({
          id: 'node3', type: 'apiNode', label: 'Send to Webhook',
          method: 'POST', url: 'https://httpbin.org/post',
          headers: { 'Content-Type': 'application/json' },
          body: '{"data": "results"}',
          position: { x: 860, y: 200 }
        })
        edges.push({ source: 'node2', target: 'node3' })
      }
    } else if (hasOrder) {
      nodes.push({
        id: 'node1', type: 'apiNode', label: 'Create Order',
        method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts',
        headers: { 'Content-Type': 'application/json' },
        body: '{"title":"New Order","body":"Order details","userId":1}',
        position: { x: 100, y: 200 }
      })
      nodes.push({
        id: 'node2', type: 'apiNode', label: 'Confirm Order',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {}, body: '',
        position: { x: 480, y: 200 }
      })
      edges.push({ source: 'node1', target: 'node2' })
    } else {
      nodes.push({
        id: 'node1', type: 'apiNode', label: 'Fetch Data',
        method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts',
        headers: {}, body: '',
        position: { x: 100, y: 200 }
      })
      nodes.push({
        id: 'node2', type: 'apiNode', label: 'Process Result',
        method: 'POST', url: 'https://httpbin.org/post',
        headers: { 'Content-Type': 'application/json' },
        body: '{"data": "processed"}',
        position: { x: 480, y: 200 }
      })
      edges.push({ source: 'node1', target: 'node2' })
    }

    return {
      nodes,
      edges,
      explanation: `Generated a ${nodes.length}-step workflow based on your description.`
    }
  }
}