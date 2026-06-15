import type { PetPoseType } from '../types/pet'

const IDENTITY_RULES = `Use the main subject in the uploaded image as the only subject. Preserve the exact same individual: species or object type, silhouette, primary colors, material or fur texture, markings, face and eye features, head details, body proportions, clothing, accessories, and every distinctive identifying detail. Do not redesign, simplify, beautify, replace, or turn it into a different character.`

const RENDER_RULES = `Render it as a believable semi-realistic faux-3D desktop companion cutout. Preserve the source subject's real anatomy, fur, feathers, skin, fabric, metal, or other material texture. Add restrained three-dimensional volume, natural surface depth, soft contact shading, gentle ambient occlusion, subtle rim light, and clean product-photography lighting from the upper front-left. Use a medium focal length with minimal perspective distortion and keep the same camera height, light direction, material treatment, and rendering style across all six poses. The result should feel dimensional and alive while still looking like the uploaded subject. Do not make it flat, card-like, sticker-like, icon-like, cel-shaded, heavily illustrated, chibi, super-deformed, toy-like, plush-like, plastic, glossy figurine-like, or excessively cartoonish. Do not place it inside a card, badge, frame, tile, rounded rectangle, platform, room, or scene.`

const OUTPUT_RULES = `Show exactly one complete subject, centered with comfortable transparent padding, fully visible from the highest point to the feet or base, with a clean readable silhouette. Transparent background with no backdrop and no environment. If transparency is unavailable, use a single pure white or very light neutral background suitable for automatic background removal. No text, watermark, logo, extra people, extra animals, duplicate body parts, unrelated props, crop, occlusion, dramatic perspective, back view, or pure side view.`

const POSE_BODY: Record<PetPoseType, string> = {
  idle:
    `Idle pose: adjust the same subject into a natural front-facing three-quarter seated pose suitable for a desktop companion. The full body is visible, the body turns slightly three-quarter while the face looks toward the viewer, posture is relaxed and balanced, front paws or equivalent limbs rest naturally, and the expression is calm and gently attentive. Preserve realistic body proportions. Do not stand, walk, lie down, lean strongly, or copy the uploaded pose.`,
  happy:
    `Happy pose: the same subject remains in a stable front-facing three-quarter seated pose, with a brighter joyful expression and a small believable celebratory movement. Slightly lift one or both front paws only when anatomically appropriate, raise the chest a little, and keep the complete body balanced and readable. The happiness should come from expression and posture, not exaggerated cartoon anatomy. Do not jump out of frame, stand upright like a human, add confetti, or add props.`,
  focus:
    `Focus pose: the same subject adopts a quiet, grounded front-facing three-quarter resting pose, naturally lying low or sitting compactly according to its real anatomy. The body settles slightly downward, the front limbs rest comfortably, the head inclines subtly forward, and the eyes look calm and attentive. The posture should suggest quiet concentration without becoming sleepy. Preserve the face and full body. Do not add books, computers, glasses, timers, desks, or other props. Do not turn away, flatten into a card, or close the eyes.`,
  sleep:
    `Sleep pose: the same subject rests in a compact natural sleeping posture while remaining clearly identifiable and mostly front-facing three-quarter. Eyes are fully closed, muscles and ears relax, the head lowers gently, and the body tucks comfortably without hiding the face or distinctive markings. Keep the full silhouette visible. Do not add a bed, blanket, pillow, moon, stars, Zzz text, or scenery. Do not crop or curl so tightly that identity is lost.`,
  remind:
    `Reminder pose: the same subject sits in a front-facing three-quarter pose with an alert caring expression. Raise one front paw or equivalent limb in a clear but natural attention gesture while the other supports the body. Keep the full body stable and preserve realistic anatomy and proportions. Do not raise extra limbs, point like a human, add bells, signs, clocks, text, or props.`,
  angry:
    `Urging or mildly annoyed pose: the same subject remains fully visible in a grounded front-facing three-quarter pose. Use a subtle impatient expression, slightly lowered brows or ears where anatomically appropriate, firmer front-limb placement, and a small forward weight shift. Keep it expressive but believable, cute, and non-threatening. Do not bare teeth, attack, become monstrous, add anger symbols, flames, text, or props.`
}

export function getPoseInstruction(pose: PetPoseType): string {
  return `${IDENTITY_RULES}\n\n${POSE_BODY[pose]}\n\n${RENDER_RULES}\n\n${OUTPUT_RULES}`
}
