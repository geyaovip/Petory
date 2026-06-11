/** V0.1 sample pet — replaced by user-generated pet.png in V0.2 */
export function PetPlaceholder(): React.ReactElement {
  return (
    <svg
      data-pet-hit
      width="140"
      height="160"
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="示例桌宠"
      className="drop-shadow-md"
    >
      <ellipse cx="70" cy="148" rx="42" ry="8" fill="#2D2A26" opacity="0.08" />
      <path
        d="M30 52C30 28 48 12 70 12C92 12 110 28 110 52V98C110 118 92 132 70 132C48 132 30 118 30 98V52Z"
        fill="#FFE8E4"
        stroke="#FF8A7A"
        strokeWidth="3"
      />
      <path d="M34 46L18 28L40 40Z" fill="#FFE8E4" stroke="#FF8A7A" strokeWidth="3" />
      <path d="M106 46L122 28L100 40Z" fill="#FFE8E4" stroke="#FF8A7A" strokeWidth="3" />
      <circle cx="54" cy="68" r="6" fill="#2D2A26" />
      <circle cx="86" cy="68" r="6" fill="#2D2A26" />
      <circle cx="56" cy="66" r="2" fill="#FFFFFF" />
      <circle cx="88" cy="66" r="2" fill="#FFFFFF" />
      <ellipse cx="70" cy="82" rx="5" ry="4" fill="#FF8A7A" />
      <path
        d="M58 92Q70 102 82 92"
        stroke="#2D2A26"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M48 118C48 134 58 144 70 144C82 144 92 134 92 118"
        fill="#FF8A7A"
        opacity="0.35"
      />
    </svg>
  )
}
