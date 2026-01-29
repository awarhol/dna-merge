import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { DNAFileUpload, type FileMetadata } from '../components/DNAFileUpload'
import { Tooltip } from '../components/Tooltip'
import { ProgressBar } from '../components/ProgressBar'
import { Tag } from '../components/Tag'
import { SEO } from '../components/SEO'
import { GITHUB_REPO } from '@/config/site'
import {
  detectFormat,
  parseAncestryFileAsync,
  parseMyHeritageFileAsync,
  parseLivingDNAFileAsync,
  parse23andMeFileAsync,
  parseFTDNAFileAsync,
  mergeSnpsAsyncN,
  generateMyHeritageCsv,
  generateAncestryCsv,
  generateLogFile,
  generateLogFileN,
  normalizeGenotypeForFormat,
} from '../utils/dna'
import { downloadCsv, downloadText } from '../utils/downloadManager'
import { localStorageLib } from '../utils/localStorage'
import { analytics } from '@/utils/analytics'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.primary},
    ${props => props.theme.colors.secondary}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0;
`

const GitHubBadge = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.textSecondary};
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: ${props => props.theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
  max-width: 600px;
`

const SupportedFormatsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const SupportedFormatsLabel = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  justify-content: center;
  align-items: center;
`

const DisclaimerBanner = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: ${props => props.theme.spacing.xl};
  background-color: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
  line-height: 1.6;

  strong {
    color: #f59e0b;
  }
`

const PrivacyNotice = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: ${props => props.theme.spacing.lg};
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};

  strong {
    color: #10b981;
  }
`

const CollapsibleSection = styled.details`
  width: 100%;
  max-width: 800px;
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  background-color: rgba(99, 102, 241, 0.05);
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;

  summary {
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    list-style: none;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
    user-select: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::before {
      content: '▶';
      display: inline-block;
      transition: transform 0.2s;
      font-size: 0.8rem;
    }
  }

  &[open] summary::before {
    transform: rotate(90deg);
  }
`

const DescriptionContent = styled.div`
  margin-top: ${props => props.theme.spacing.md};
`

const DescriptionSubtitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-top: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const DescriptionList = styled.ul`
  margin: ${props => props.theme.spacing.sm} 0;
  padding-left: ${props => props.theme.spacing.lg};

  li {
    margin-bottom: ${props => props.theme.spacing.xs};
  }
`

const UploadSection = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: ${props => props.theme.spacing.md};
`

const MergeButton = styled.button<{ disabled: boolean }>`
  background: ${props =>
    props.disabled ? props.theme.colors.textSecondary : props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  border: none;
  font-weight: 600;
  margin-top: ${props => props.theme.spacing.xl};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.5 : 1)};
  font-size: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  min-width: 120px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
  }
`

const ButtonSpinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

const ResultsSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 600px;
  padding: ${props => props.theme.spacing.lg};
  background-color: rgba(99, 102, 241, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
`

const SuccessMessage = styled.p`
  color: #10b981;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`

const ErrorMessage = styled.p`
  color: #ef4444;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`

const StatsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing.md} 0;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.95rem;

  li {
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`

const DownloadButtonsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`

const DownloadButton = styled.button`
  background: ${props => props.theme.colors.secondary};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`

const ResetButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  border: 1px solid ${props => props.theme.colors.textSecondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.md};
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const OptionsSection = styled.div`
  width: 100%;
  max-width: 600px;
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  background-color: rgba(99, 102, 241, 0.05);
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid rgba(99, 102, 241, 0.2);
`

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};

  &:last-child {
    margin-bottom: 0;
  }

  label {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
  }
`

const Select = styled.select`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.textSecondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: ${props => props.theme.colors.primary};
`

const LabelWithTooltip = styled.div`
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
`

const ProcessingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  width: 100%;
  max-width: 400px;
`

const formatParsers: Record<
  'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna',
  typeof parseAncestryFileAsync
> = {
  ancestry: parseAncestryFileAsync,
  myheritage: parseMyHeritageFileAsync,
  livingdna: parseLivingDNAFileAsync,
  '23andme': parse23andMeFileAsync,
  ftdna: parseFTDNAFileAsync,
}

export const Home = () => {
  const { t } = useTranslation(['home', 'common', 'algorithm'])
  const [dnaFiles, setDnaFiles] = useState<string[]>([])
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [mergedCsv, setMergedCsv] = useState<string | null>(null)
  const [logFile, setLogFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalSnps: number
    conflicts: number
    skipped: number
  } | null>(null)
  const [outputFormat, setOutputFormat] = useState<'ancestry' | 'myheritage'>(
    localStorageLib.getOutputFormat
  )
  const [fillMissing, setFillMissing] = useState(true)
  const [parseMultibaseGenotypes, setParseMultibaseGenotypes] = useState(false)
  const [includeInvalidPositions, setIncludeInvalidPositions] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [progress, setProgress] = useState(0)

  // Save output format to localStorage whenever it changes
  useEffect(() => {
    localStorageLib.setOutputFormat(outputFormat)
  }, [outputFormat])

  const isSingleFileMode = dnaFiles.length === 1
  const isMergeMode = dnaFiles.length >= 2 && dnaFiles.length <= 10

  const handleFilesChange = (files: string[], metadata?: FileMetadata[]) => {
    setDnaFiles(files)
    setFileMetadata(metadata || [])
    setMergedCsv(null)
    setLogFile(null)
    setError(null)
    setStats(null)

    // Track file uploads
    metadata?.forEach((meta, index) => {
      analytics.fileUploaded(meta.format, (index + 1) as 1 | 2)
    })
  }

  const handleMerge = async () => {
    if (dnaFiles.length < 2 || dnaFiles.length > 10) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      // Detect formats for all files
      const formats = dnaFiles.map(file => detectFormat(file))

      if (formats.some(format => format === 'unknown')) {
        throw new Error(t('common:errors.format_detection'))
      }

      // Phase 1: Parse all files (0-70%)
      const parsedFiles = []
      const progressPerFile = 70 / dnaFiles.length

      for (let i = 0; i < dnaFiles.length; i++) {
        const parser = formatParsers[formats[i] as keyof typeof formatParsers]
        const startProgress = i * progressPerFile
        const parsed = await parser(
          dnaFiles[i],
          i, // Use 0-based index
          p => setProgress(startProgress + (p / 100) * progressPerFile),
          parseMultibaseGenotypes,
          includeInvalidPositions
        )
        parsedFiles.push(parsed)
      }

      // Phase 2: Merge SNPs using N-way algorithm (70-95%)
      const mergeResult = await mergeSnpsAsyncN(
        parsedFiles,
        {
          fillMissing,
        },
        p => setProgress(70 + p * 0.25)
      )

      // Phase 3: Generate output (95-98%)
      setProgress(95)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Normalize genotypes for output format
      const normalizedSnps = mergeResult.mergedSnps.map(snp => ({
        ...snp,
        genotype: normalizeGenotypeForFormat(snp.genotype, outputFormat),
      }))

      let csvContent: string
      let excludedPAR = 0

      if (outputFormat === 'myheritage') {
        const result = generateMyHeritageCsv(normalizedSnps)
        csvContent = result.csv
        excludedPAR = result.excludedPAR
      } else {
        csvContent = generateAncestryCsv(normalizedSnps)
      }

      // Phase 4: Generate log (98-100%)
      setProgress(98)
      await new Promise(resolve => setTimeout(resolve, 50))

      const logContent = generateLogFileN(
        mergeResult.conflicts,
        mergeResult.skippedRows,
        fileMetadata.map(f => f.name),
        mergeResult.filesMetadata,
        excludedPAR
      )

      setProgress(100)

      setMergedCsv(csvContent)
      setLogFile(logContent)
      setStats({
        totalSnps: mergeResult.mergedSnps.length,
        conflicts: mergeResult.conflicts.length,
        skipped: mergeResult.skippedRows.length,
      })

      // Track successful merge
      const formatList = formats.join('+')
      analytics.filesMerged(formatList, formatList, mergeResult.mergedSnps.length)
    } catch (err) {
      setError((err as Error).message || t('common:errors.merge_error'))
      analytics.errorOccurred('Merge Error', (err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConvertSingleFile = async () => {
    if (dnaFiles.length !== 1) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const sourceFormat = detectFormat(dnaFiles[0])

      if (sourceFormat === 'unknown') {
        throw new Error(t('common:errors.format_detection_single'))
      }

      // Use the currently selected outputFormat from state (persisted in localStorage)
      const targetFormat = outputFormat

      // Phase 1: Parse file (0-80%)
      const parsed = await formatParsers[sourceFormat](
        dnaFiles[0],
        1,
        p => setProgress(p * 0.8),
        parseMultibaseGenotypes,
        includeInvalidPositions
      )

      // Phase 2: Normalize (80%)
      setProgress(80)
      await new Promise(resolve => setTimeout(resolve, 50))

      const normalizedSnps = parsed.snps.map(snp => ({
        ...snp,
        genotype: normalizeGenotypeForFormat(snp.genotype, targetFormat),
      }))

      // Phase 3: Generate output (90%)
      setProgress(90)
      await new Promise(resolve => setTimeout(resolve, 50))

      let csvContent: string
      let excludedPAR = 0

      if (targetFormat === 'myheritage') {
        const result = generateMyHeritageCsv(normalizedSnps)
        csvContent = result.csv
        excludedPAR = result.excludedPAR
      } else {
        csvContent = generateAncestryCsv(normalizedSnps)
      }

      setProgress(95)
      await new Promise(resolve => setTimeout(resolve, 50))

      const logContent = generateLogFile([], parsed.errors, excludedPAR)

      setProgress(100)

      setMergedCsv(csvContent)
      setLogFile(logContent)
      setStats({
        totalSnps: normalizedSnps.length,
        conflicts: 0,
        skipped: parsed.errors.length,
      })

      // Track successful conversion
      analytics.formatConverted(sourceFormat, targetFormat)
    } catch (err) {
      setError((err as Error).message || t('common:errors.convert_error'))
      analytics.errorOccurred('Conversion Error', (err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = () => {
    if (isSingleFileMode) {
      handleConvertSingleFile()
    } else if (isMergeMode) {
      handleMerge()
    }
  }

  const handleDownloadCsv = () => {
    if (mergedCsv) {
      const now = new Date()
      const timestamp = now.toISOString().replace('T', '--').substring(0, 16).replace(':', '-')
      const extension = outputFormat === 'myheritage' ? 'csv' : 'txt'

      let filename: string
      if (isSingleFileMode) {
        const sourceFormat = detectFormat(dnaFiles[0])
        filename = `convert-${sourceFormat}-to-${outputFormat}--${timestamp}.${extension}`
      } else {
        const fillMissingStr = fillMissing ? 'yes' : 'no'
        filename = `merged_${dnaFiles.length}_files_${outputFormat}--fill-missing-${fillMissingStr}--${timestamp}.${extension}`
      }

      if (extension === 'csv') {
        downloadCsv(mergedCsv, filename)
      } else {
        downloadText(mergedCsv, filename)
      }

      // Track download
      const fileType = isSingleFileMode ? 'converted' : 'merged'
      analytics.fileDownloaded(fileType, outputFormat)
    }
  }

  const handleDownloadLog = () => {
    if (logFile) {
      const now = new Date()
      const timestamp = now.toISOString().replace('T', '--').substring(0, 16).replace(':', '-')

      let filename: string
      if (isSingleFileMode) {
        const sourceFormat = detectFormat(dnaFiles[0])
        filename = `convert-${sourceFormat}-to-${outputFormat}--${timestamp}--log.txt`
      } else {
        const fillMissingStr = fillMissing ? 'yes' : 'no'
        filename = `merged_${dnaFiles.length}_files_${outputFormat}--fill-missing-${fillMissingStr}--${timestamp}--log.txt`
      }

      downloadText(logFile, filename)
      analytics.fileDownloaded('log', 'text')
    }
  }

  const handleReset = () => {
    setDnaFiles([])
    setMergedCsv(null)
    setLogFile(null)
    setError(null)
    setStats(null)
    setResetTrigger(prev => prev + 1)
  }

  return (
    <>
      <SEO />
      <Container>
        <HeaderSection>
          <Title>{t('home:title')}</Title>
          <GitHubBadge href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {t('home:github_badge')}
          </GitHubBadge>
        </HeaderSection>
        <Subtitle>{t('home:subtitle')}</Subtitle>

        <SupportedFormatsSection>
          <SupportedFormatsLabel>{t('home:supported_input_formats')}</SupportedFormatsLabel>
          <TagsContainer>
            <Tag variant="ancestry">Ancestry</Tag>
            <Tag variant="myheritage">MyHeritage</Tag>
            <Tag variant="livingdna">LivingDNA</Tag>
            <Tag variant="ftdna">FTDNA</Tag>
            <Tag variant="23andme">23andMe</Tag>
          </TagsContainer>
        </SupportedFormatsSection>

        <SupportedFormatsSection>
          <SupportedFormatsLabel>{t('home:supported_output_formats')}</SupportedFormatsLabel>
          <TagsContainer>
            <Tag variant="ancestry">Ancestry</Tag>
            <Tag variant="myheritage">MyHeritage</Tag>
          </TagsContainer>
        </SupportedFormatsSection>

        <UploadSection>
          <DNAFileUpload onFilesChange={handleFilesChange} resetTrigger={resetTrigger} />
        </UploadSection>

        {(isSingleFileMode || isMergeMode) && !mergedCsv && !isProcessing && (
          <OptionsSection>
            <OptionRow>
              <label>{t('home:options.output_format')}</label>
              <Select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value as 'ancestry' | 'myheritage')}
              >
                <option value="myheritage">MyHeritage</option>
                <option value="ancestry">Ancestry</option>
              </Select>
            </OptionRow>
            {isMergeMode && (
              <OptionRow>
                <LabelWithTooltip>
                  <span>{t('home:options.fill_missing')}</span>
                  <Tooltip content={t('home:options.tooltip_fill')} />
                </LabelWithTooltip>
                <Checkbox checked={fillMissing} onChange={e => setFillMissing(e.target.checked)} />
              </OptionRow>
            )}
            <OptionRow>
              <LabelWithTooltip>
                <span>{t('home:options.parse_multibase')}</span>
                <Tooltip content={t('home:options.tooltip_multibase')} />
              </LabelWithTooltip>
              <Checkbox
                checked={parseMultibaseGenotypes}
                onChange={e => setParseMultibaseGenotypes(e.target.checked)}
              />
            </OptionRow>
            <OptionRow>
              <LabelWithTooltip>
                <span>{t('home:options.include_invalid_positions')}</span>
                <Tooltip content={t('home:options.tooltip_invalid_positions')} />
              </LabelWithTooltip>
              <Checkbox
                checked={includeInvalidPositions}
                onChange={e => setIncludeInvalidPositions(e.target.checked)}
              />
            </OptionRow>
          </OptionsSection>
        )}

        {!mergedCsv && (
          <ProcessingContainer>
            <MergeButton
              disabled={(!isSingleFileMode && !isMergeMode) || isProcessing}
              onClick={handleProcess}
            >
              {isProcessing && <ButtonSpinner />}
              {isProcessing
                ? isSingleFileMode
                  ? t('common:buttons.converting')
                  : t('common:buttons.merging')
                : isSingleFileMode
                  ? t('common:buttons.convert')
                  : t('common:buttons.merge')}
            </MergeButton>
            {isProcessing && (
              <ProgressBar progress={progress} label={t('common:processing.label')} />
            )}
          </ProcessingContainer>
        )}

        {error && (
          <ResultsSection>
            <ErrorMessage>{error}</ErrorMessage>
            <ResetButton onClick={handleReset}>{t('common:buttons.try_again')}</ResetButton>
          </ResultsSection>
        )}

        {mergedCsv && stats && (
          <ResultsSection>
            <SuccessMessage>
              {isSingleFileMode ? t('common:success.convert') : t('common:success.merge')}
            </SuccessMessage>
            <StatsList>
              <li>
                {t('common:stats.total_snps', {
                  mode: t(`common:modes.${isSingleFileMode ? 'converted' : 'merged'}`),
                })}{' '}
                {stats.totalSnps.toLocaleString()}
              </li>
              <li>
                {t('common:stats.conflicts')} {stats.conflicts}
              </li>
              <li>
                {t('common:stats.skipped')} {stats.skipped}
              </li>
            </StatsList>
            <DownloadButtonsContainer>
              <DownloadButton onClick={handleDownloadCsv}>
                {t(
                  isSingleFileMode
                    ? 'common:buttons.download_converted_dna'
                    : 'common:buttons.download_merged_dna'
                )}
              </DownloadButton>
              <DownloadButton onClick={handleDownloadLog}>
                {t('common:buttons.download_log')}
              </DownloadButton>
            </DownloadButtonsContainer>
            <ResetButton onClick={handleReset}>
              {t(isSingleFileMode ? 'common:buttons.convert_more' : 'common:buttons.merge_more')}
            </ResetButton>
          </ResultsSection>
        )}

        <DisclaimerBanner>
          <strong>{t('home:disclaimer.title')}</strong> {t('home:disclaimer.message')}
        </DisclaimerBanner>

        <PrivacyNotice>
          <strong>🔒 {t('home:privacy.title')}</strong> {t('home:privacy.message')}
        </PrivacyNotice>

        <CollapsibleSection>
          <summary>{t('algorithm:section_title')}</summary>
          <DescriptionContent>
            <p>{t('algorithm:intro')}</p>

            <DescriptionSubtitle>{t('algorithm:problem.title')}</DescriptionSubtitle>
            <p>{t('algorithm:problem.description')}</p>
            <DescriptionList>
              <li>{t('algorithm:problem.list.different_snps')}</li>
              <li>{t('algorithm:problem.list.gaps')}</li>
              <li>{t('algorithm:problem.list.conflicts')}</li>
            </DescriptionList>
            <p>{t('algorithm:problem.conclusion')}</p>

            <DescriptionSubtitle>{t('algorithm:process.title')}</DescriptionSubtitle>
            <DescriptionList>
              <li>
                <strong>{t('algorithm:process.step1.title')}</strong> -{' '}
                {t('algorithm:process.step1.description')}
              </li>
              <li>
                <strong>{t('algorithm:process.step2.title')}</strong> -{' '}
                {t('algorithm:process.step2.description')}
              </li>
              <li>
                <strong>{t('algorithm:process.step3.title')}</strong> -{' '}
                {t('algorithm:process.step3.description')}
              </li>
            </DescriptionList>

            <DescriptionSubtitle>{t('algorithm:conflict_resolution.title')}</DescriptionSubtitle>
            <p>{t('algorithm:conflict_resolution.description')}</p>
            <DescriptionList>
              <li>
                <strong>{t('algorithm:conflict_resolution.fill_missing.title')}</strong>{' '}
                {t('algorithm:conflict_resolution.fill_missing.description')}
              </li>
              <li>
                <strong>{t('algorithm:conflict_resolution.prefer_file.title')}</strong>{' '}
                {t('algorithm:conflict_resolution.prefer_file.description')}
              </li>
            </DescriptionList>

            <DescriptionSubtitle>{t('algorithm:understanding_data.title')}</DescriptionSubtitle>
            <p>{t('algorithm:understanding_data.description')}</p>
            <DescriptionList>
              <li>
                <strong>{t('algorithm:understanding_data.rsid')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:understanding_data.chromosome')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:understanding_data.position')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:understanding_data.genotype')}</strong>
              </li>
            </DescriptionList>

            <DescriptionSubtitle>{t('algorithm:why_matters.title')}</DescriptionSubtitle>
            <DescriptionList>
              <li>
                <strong>{t('algorithm:why_matters.list.matches')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:why_matters.list.gaps')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:why_matters.list.accuracy')}</strong>
              </li>
              <li>
                <strong>{t('algorithm:why_matters.list.tools')}</strong>
              </li>
            </DescriptionList>

            <p style={{ marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
              {t('algorithm:footer')}
            </p>
          </DescriptionContent>
        </CollapsibleSection>
      </Container>
    </>
  )
}
