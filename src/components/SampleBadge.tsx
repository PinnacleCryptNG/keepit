import { FlaskConical } from 'lucide-react'

/** Marks made-up data so nobody mistakes it for real activity. */
export function SampleBadge({ children = 'Sample data' }: { children?: string }) {
  return (
    <span className="tag w-fit !bg-sun !text-[#1b1335]">
      <FlaskConical size={12} /> {children}
    </span>
  )
}
