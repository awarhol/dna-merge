import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { analytics } from '@/utils/analytics'

const SwitcherContainer = styled.div`
  position: fixed;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 1000;
`

const LanguageSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  outline: none;

  &:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
  }

  &:focus {
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.3);
  }

  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value
    i18n.changeLanguage(newLanguage)
    analytics.languageChanged(newLanguage)
  }

  return (
    <SwitcherContainer>
      <LanguageSelect value={i18n.language} onChange={changeLanguage} aria-label="Select language">
        <option value="en">🇬🇧 EN</option>
        <option value="uk">🇺🇦 UA</option>
        <option value="pl">🇵🇱 PL</option>
      </LanguageSelect>
    </SwitcherContainer>
  )
}
