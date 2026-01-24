import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const SwitcherContainer = styled.div`
  position: fixed;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 1000;
`

const LanguageButton = styled.button<{ active: boolean }>`
  background: ${props =>
    props.active ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid
    ${props => (props.active ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.2)')};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${props => (props.active ? '600' : '400')};
  transition: all 0.2s;

  &:first-child {
    border-radius: ${props => props.theme.borderRadius.sm} 0 0
      ${props => props.theme.borderRadius.sm};
    border-right: none;
  }

  &:last-child {
    border-radius: 0 ${props => props.theme.borderRadius.sm}
      ${props => props.theme.borderRadius.sm} 0;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
  }
`

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <SwitcherContainer>
      <LanguageButton
        active={i18n.language === 'en'}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        EN
      </LanguageButton>
      <LanguageButton
        active={i18n.language === 'uk'}
        onClick={() => changeLanguage('uk')}
        aria-label="Switch to Ukrainian"
      >
        UK
      </LanguageButton>
    </SwitcherContainer>
  )
}
