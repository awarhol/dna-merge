import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  max-width: 600px;
  width: 100%;
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Text = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.md};
`

const FeatureList = styled.ul`
  list-style: none;
  margin: ${props => props.theme.spacing.lg} 0;
`

const FeatureItem = styled.li`
  color: ${props => props.theme.colors.textSecondary};
  padding: ${props => props.theme.spacing.sm} 0;

  &:before {
    content: '✓';
    color: ${props => props.theme.colors.success};
    font-weight: bold;
    margin-right: ${props => props.theme.spacing.sm};
  }
`

const BackButton = styled(Link)`
  display: inline-block;
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.secondary};
  }
`

export const About = () => {
  return (
    <Container>
      <Card>
        <Title>About Merge DNA</Title>
        <Text>
          This is a modern React application scaffolded with all the essential tools and
          configurations for building production-ready web applications.
        </Text>
        <FeatureList>
          <FeatureItem>React 19 with TypeScript</FeatureItem>
          <FeatureItem>Vite for lightning-fast development</FeatureItem>
          <FeatureItem>React Router for client-side routing</FeatureItem>
          <FeatureItem>styled-components for component styling</FeatureItem>
          <FeatureItem>Vitest + React Testing Library for testing</FeatureItem>
          <FeatureItem>ESLint + Prettier for code quality</FeatureItem>
          <FeatureItem>Path aliases for clean imports</FeatureItem>
        </FeatureList>
        <BackButton to="/">← Back to Home</BackButton>
      </Card>
    </Container>
  )
}
