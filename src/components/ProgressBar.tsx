import styled from 'styled-components'

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: rgba(99, 102, 241, 0.2);
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`

const ProgressBarFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.primary},
    ${props => props.theme.colors.secondary}
  );
  transition: width 0.15s linear;
  border-radius: ${props => props.theme.borderRadius.md};
`

const ProgressText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
`

interface ProgressBarProps {
  progress: number
  showPercentage?: boolean
  label?: string
}

export const ProgressBar = ({ progress, showPercentage = true, label }: ProgressBarProps) => {
  return (
    <ProgressContainer>
      <ProgressBarContainer>
        <ProgressBarFill progress={progress} />
      </ProgressBarContainer>
      {showPercentage && (
        <ProgressText>
          <span>
            {label ? `${label}: ` : ''}
            {Math.round(progress)}%
          </span>
        </ProgressText>
      )}
    </ProgressContainer>
  )
}
