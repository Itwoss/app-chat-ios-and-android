import { createContext, useContext } from 'react'

export const SlideHandledByParentContext = createContext(false)

export function useSlideHandledByParent() {
  return useContext(SlideHandledByParentContext)
}
