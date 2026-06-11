import path from 'path'
import type { ReferenceMode } from '../../../src/shared/generation/reference'
import { getStylePrompt } from '../../../src/shared/prompts/stylePrompts'
import type { PetVisualState } from '../../../src/shared/types/growth'
import type { PetStyleType } from '../../../src/shared/types/pet'
import { getMinimaxApiKey } from '../apiKeys'
import { prepareReferenceFromPath } from './prepareReference'

interface MiniMaxImageResponse {
  base_resp?: { status_code: number; status_msg: string }
  data?: { image_base64?: string[]; image_urls?: string[] }
}

export interface GeneratePetImageOptions {
  seed?: number
  referenceMode?: ReferenceMode
}

function getApiKey(): string {
  const key = getMinimaxApiKey()
  if (!key) {
    throw new Error('MiniMax API Key is not configured. Add it in Settings or .env.')
  }
  return key
}

function getApiBase(): string {
  return process.env['MINIMAX_API_BASE'] ?? 'https://api.minimaxi.com'
}

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function generatePetImage(
  referencePath: string,
  styleType: PetStyleType = 'petory',
  pose: PetVisualState = 'idle',
  options: GeneratePetImageOptions = {}
): Promise<Buffer> {
  const referenceMode = options.referenceMode ?? 'upload'
  const prepared = await prepareReferenceFromPath(referencePath, referenceMode)
  const dataUrl = toDataUrl(prepared.buffer, prepared.mimeType)
  const promptOptimizer = referenceMode === 'upload' ? false : true
  console.info(
    `[petory] MiniMax subject_reference: ${referencePath} (source=${prepared.sourceBytes}B → prepared=${prepared.preparedBytes}B, ${prepared.mimeType}, mode=${referenceMode}, pose=${pose}, prompt_optimizer=${promptOptimizer}, seed=${options.seed ?? 'omitted'}, attached=true)`
  )

  const body: Record<string, unknown> = {
    model: 'image-01',
    prompt: getStylePrompt(styleType, pose, referenceMode),
    aspect_ratio: '3:4',
    response_format: 'base64',
    n: 1,
    prompt_optimizer: promptOptimizer,
    subject_reference: [
      {
        type: 'character',
        image_file: dataUrl
      }
    ]
  }

  if (options.seed !== undefined) {
    body.seed = options.seed
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`
  }

  const groupId = process.env['MINIMAX_GROUP_ID']
  if (groupId) {
    headers['Group-Id'] = groupId
  }

  const url = new URL(`${getApiBase()}/v1/image_generation`)
  if (groupId) {
    url.searchParams.set('GroupId', groupId)
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MiniMax HTTP ${response.status}: ${text}`)
  }

  const json = (await response.json()) as MiniMaxImageResponse
  const statusCode = json.base_resp?.status_code ?? -1

  if (statusCode !== 0) {
    throw new Error(
      `MiniMax error ${statusCode}: ${json.base_resp?.status_msg ?? 'unknown error'}`
    )
  }

  const base64 = json.data?.image_base64?.[0]
  if (base64) {
    return Buffer.from(base64, 'base64')
  }

  const imageUrl = json.data?.image_urls?.[0]
  if (imageUrl) {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download MiniMax image: ${imageResponse.status}`)
    }
    return Buffer.from(await imageResponse.arrayBuffer())
  }

  throw new Error('MiniMax returned no image data')
}
