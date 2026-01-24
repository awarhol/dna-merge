import { useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
`

const Count = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`

const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s;

  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
  }
`

export const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <Container>
      <Count data-testid="count">{count}</Count>
      <ButtonGroup>
        <Button onClick={() => setCount(count - 1)}>-</Button>
        <Button onClick={() => setCount(0)}>Reset</Button>
        <Button onClick={() => setCount(count + 1)}>+</Button>
      </ButtonGroup>
    </Container>
  )
}
