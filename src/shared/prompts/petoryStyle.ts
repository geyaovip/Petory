const SPECIES_LOCK = `Keep the same animal species as the reference (cat stays cat, dog stays dog).`

/** Upload: short prompt — long "subject" wording + prompt_optimizer tends to ignore the reference. */
export const PETORY_STYLE_PROMPT_BASE = `Image-to-image from the reference photo. Same pet: species, breed, colors, markings, face, ears, body shape. ${SPECIES_LOCK} Only change pose below. Plain background, full body, no text or extra objects.`

export const ANCHOR_STYLE_PROMPT_BASE = `Same individual pet as the reference image. ${SPECIES_LOCK} Keep colors, markings, and proportions. Only change pose below. Plain background.`

/** @deprecated Use getStylePrompt('petory', pose) */
export const PETORY_STYLE_PROMPT = `${PETORY_STYLE_PROMPT_BASE}
Pose: relaxed front-facing 3/4 sitting view, face toward the viewer, full body visible.
Plain solid background only. No text, watermark, extra animals, extra people, furniture, scenery, or unrelated objects. Do not crop the body.`
