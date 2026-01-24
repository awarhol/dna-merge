import styled from 'styled-components'

const TooltipContainer = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`

const QuestionMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.theme.colors.textSecondary};
  color: ${props => props.theme.colors.background};
  font-size: 0.7rem;
  font-weight: bold;
  cursor: help;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.colors.primary};
  }
`

const TooltipContent = styled.span`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 50%;
  transform: translateX(50%);
  background: ${props => props.theme.colors.text};
  color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.8rem;
  line-height: 1.4;
  width: max-content;
  max-width: 320px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  white-space: normal;

  ${TooltipContainer}:hover & {
    opacity: 1;
    visibility: visible;
  }

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${props => props.theme.colors.text};
  }
`

interface TooltipProps {
  content: string
}

export const Tooltip = ({ content }: TooltipProps) => {
  return (
    <TooltipContainer>
      <QuestionMark>?</QuestionMark>
      <TooltipContent>{content}</TooltipContent>
    </TooltipContainer>
  )
}
