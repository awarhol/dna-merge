import styled from 'styled-components'

type TagVariant = 'ancestry' | 'myheritage' | 'unknown' | 'success' | 'error' | 'info' | 'default'

const StyledTag = styled.span<{ variant: TagVariant }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.variant) {
      case 'ancestry':
        return '#10b981' // green
      case 'myheritage':
        return '#3b82f6' // blue
      case 'success':
        return '#10b981' // green
      case 'error':
        return '#ef4444' // red
      case 'info':
        return '#3b82f6' // blue
      case 'unknown':
      case 'default':
      default:
        return '#6b7280' // gray
    }
  }};
  color: white;
`

interface TagProps {
  variant?: TagVariant
  children: React.ReactNode
}

export const Tag = ({ variant = 'default', children }: TagProps) => {
  return <StyledTag variant={variant}>{children}</StyledTag>
}
