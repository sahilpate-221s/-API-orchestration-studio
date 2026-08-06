// // import { Router, Response } from 'express'
// // import { authMiddleware, AuthRequest } from '../middleware/auth'
// // import { generateApiCall, fixApiCall } from '../services/aiService'
// // import { aiRateLimit } from '../middleware/rateLimits'

// // const router = Router()

// // router.post('/generate', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
// //   try {
// //     const { description } = req.body
// //     if (!description) {
// //       res.status(400).json({ message: 'Description is required' })
// //       return
// //     }
// //     const config = await generateApiCall(description)
// //     res.json({ config })
// //   } catch (err) {
// //     res.status(500).json({ message: 'AI generation failed', error: err })
// //   }
// // })

// // router.post('/fix', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
// //   try {
// //     const { error, config } = req.body
// //     if (!error || !config) {
// //       res.status(400).json({ message: 'Error and config are required' })
// //       return
// //     }
// //     const fixedConfig = await fixApiCall(error, config)
// //     res.json({ config: fixedConfig })
// //   } catch (err) {
// //     res.status(500).json({ message: 'AI fixing failed', error: err })
// //   }
// // })

// // export default router



// import { Router, Response } from 'express'
// import { authMiddleware, AuthRequest } from '../middleware/auth'
// import { generateApiCall, fixApiCall, generateWorkflow } from '../services/aiService'
// import { aiRateLimit } from '../middleware/rateLimits'

// const router = Router()

// router.post('/generate', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
//   try {
//     const { description } = req.body
//     if (!description) {
//       res.status(400).json({ message: 'Description is required' })
//       return
//     }
//     const config = await generateApiCall(description)
//     res.json({ config })
//   } catch (err) {
//     res.status(500).json({ message: 'AI generation failed', error: err })
//   }
// })

// router.post('/fix', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
//   try {
//     const { error, config } = req.body
//     if (!error || !config) {
//       res.status(400).json({ message: 'Error and config are required' })
//       return
//     }
//     const fixedConfig = await fixApiCall(error, config)
//     res.json({ config: fixedConfig })
//   } catch (err) {
//     res.status(500).json({ message: 'AI fixing failed', error: err })
//   }
// })

// router.post('/generate-workflow', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
//   try {
//     const { description } = req.body
//     if (!description) {
//       res.status(400).json({ message: 'Description is required' })
//       return
//     }
//     const workflow = await generateWorkflow(description)
//     res.json({ workflow })
//   } catch (err) {
//     res.status(500).json({ message: 'Workflow generation failed', error: err })
//   }
// })

// export default router

import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { generateApiCall, fixApiCall, generateWorkflow, generateWorkflowFromOpenAPI } from '../services/aiService'
import { aiRateLimit } from '../middleware/rateLimits'
import multer from 'multer'
import yaml from 'js-yaml'

// Use memory storage — we parse and discard the file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/json', 'text/yaml', 'text/x-yaml', 'application/x-yaml', 'application/yaml', 'text/plain']
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.yaml') || file.originalname.endsWith('.yml') || file.originalname.endsWith('.json')) {
      cb(null, true)
    } else {
      cb(new Error('Only .json and .yaml/.yml files are allowed'))
    }
  }
})

const router = Router()

router.post('/generate', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body
    if (!description) {
      res.status(400).json({ message: 'Description is required' })
      return
    }
    const config = await generateApiCall(description)
    res.json({ config })
  } catch (err) {
    res.status(500).json({ message: 'AI generation failed', error: err })
  }
})

router.post('/fix', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { error, config } = req.body
    if (!error || !config) {
      res.status(400).json({ message: 'Error and config are required' })
      return
    }
    const fixedConfig = await fixApiCall(error, config)
    res.json({ config: fixedConfig })
  } catch (err) {
    res.status(500).json({ message: 'AI fixing failed', error: err })
  }
})

router.post('/generate-workflow', authMiddleware, aiRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body
    if (!description) {
      res.status(400).json({ message: 'Description is required' })
      return
    }
    const workflow = await generateWorkflow(description)
    res.json({ workflow })
  } catch (err) {
    res.status(500).json({ message: 'Workflow generation failed', error: err })
  }
})

router.post(
  '/import-openapi',
  authMiddleware,
  aiRateLimit,
  upload.single('spec'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' })
        return
      }

      const fileContent = req.file.buffer.toString('utf-8')
      const fileName = req.file.originalname.toLowerCase()
      const userPrompt = req.body.prompt as string | undefined

      // Parse the spec
      let spec: any
      try {
        if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
          spec = yaml.load(fileContent)
        } else {
          spec = JSON.parse(fileContent)
        }
      } catch (parseErr) {
        res.status(400).json({ message: 'Invalid file format. Must be valid JSON or YAML.' })
        return
      }

      // Validate it looks like an OpenAPI spec
      if (!spec || (!spec.paths && !spec.swagger && !spec.openapi)) {
        res.status(400).json({ message: 'File does not appear to be a valid OpenAPI/Swagger spec' })
        return
      }

      const workflow = await generateWorkflowFromOpenAPI(spec, userPrompt)
      res.json({ workflow })

    } catch (err: any) {
      console.error('OpenAPI import error:', err)
      res.status(500).json({ message: err.message ?? 'Failed to import OpenAPI spec' })
    }
  }
)

export default router