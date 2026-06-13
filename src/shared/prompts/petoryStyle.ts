export const PETORY_STYLE_PROMPT_BASE = `Keep the exact subject in the reference image unchanged, including identity, species, breed, face, colors, markings, ears, eyes, and body proportions. Change only the pose described below. Show one full-body subject on a plain background, with no text or extra objects.`

export const ANCHOR_STYLE_PROMPT_BASE = `Keep the exact same subject from the reference image. Preserve all identity details and change only the pose described below. Plain background.`

/** @deprecated Use getStylePrompt('petory', pose) */
export const PETORY_STYLE_PROMPT = `${PETORY_STYLE_PROMPT_BASE}
Pose: relaxed front-facing 3/4 sitting view, face toward the viewer, full body visible.
Plain solid background only. No text, watermark, extra animals, extra people, furniture, scenery, or unrelated objects. Do not crop the body.`
