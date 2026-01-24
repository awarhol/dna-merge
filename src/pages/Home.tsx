import { useState } from 'react'
import styled from 'styled-components'
import { DNAFileUpload, type FileMetadata } from '../components/DNAFileUpload'
import { Tooltip } from '../components/Tooltip'
import { ProgressBar } from '../components/ProgressBar'
import {
  detectFormat,
  parseAncestryFileAsync,
  parseMyHeritageFileAsync,
  mergeSnpsAsync,
  generateMyHeritageCsv,
  generateAncestryTsv,
  generateLogFile,
  getOppositeFormat,
  normalizeGenotypeForFormat,
} from '../utils/dnaParser'
import { downloadCsv, downloadText } from '../utils/downloadManager'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
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
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
  max-width: 600px;
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
  margin-top: ${props => props.theme.spacing.xl};
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
  display: flex;
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
  margin-top: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`

export const Home = () => {
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
  const [outputFormat, setOutputFormat] = useState<'ancestry' | 'myheritage'>('myheritage')
  const [preferredFileIndex, setPreferredFileIndex] = useState<number>(0)
  const [fillMissing, setFillMissing] = useState(true)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [progress, setProgress] = useState(0)

  const isSingleFileMode = dnaFiles.length === 1
  const isMergeMode = dnaFiles.length === 2

  const handleFilesChange = (files: string[], metadata?: FileMetadata[]) => {
    setDnaFiles(files)
    setFileMetadata(metadata || [])
    setMergedCsv(null)
    setLogFile(null)
    setError(null)
    setStats(null)
    setPreferredFileIndex(0)
  }

  const handleMerge = async () => {
    if (dnaFiles.length !== 2) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const format1 = detectFormat(dnaFiles[0])
      const format2 = detectFormat(dnaFiles[1])

      if (format1 === 'unknown' || format2 === 'unknown') {
        throw new Error(
          'Unable to detect file format. Please ensure files are valid Ancestry or MyHeritage DNA files.'
        )
      }

      // Phase 1: Parse file 1 (0-35%)
      const parsed1 =
        format1 === 'ancestry'
          ? await parseAncestryFileAsync(dnaFiles[0], 1, p => setProgress(p * 0.35))
          : await parseMyHeritageFileAsync(dnaFiles[0], 1, p => setProgress(p * 0.35))

      // Phase 2: Parse file 2 (35-70%)
      const parsed2 =
        format2 === 'ancestry'
          ? await parseAncestryFileAsync(dnaFiles[1], 2, p => setProgress(35 + p * 0.35))
          : await parseMyHeritageFileAsync(dnaFiles[1], 2, p => setProgress(35 + p * 0.35))

      // Phase 3: Merge SNPs (70-95%)
      const preferredFile = (preferredFileIndex + 1) as 1 | 2 // Convert to 1-based index

      const mergeResult = await mergeSnpsAsync(
        parsed1.snps,
        parsed2.snps,
        {
          preferredFile,
          fillMissing,
        },
        p => setProgress(70 + p * 0.25)
      )

      const allSkipped = [...parsed1.errors, ...parsed2.errors, ...mergeResult.skippedRows]

      // Phase 4: Generate output (95-98%)
      setProgress(95)
      await new Promise(resolve => setTimeout(resolve, 50))

      let csvContent: string
      let excludedPAR = 0

      if (outputFormat === 'myheritage') {
        const result = generateMyHeritageCsv(mergeResult.mergedSnps)
        csvContent = result.csv
        excludedPAR = result.excludedPAR
      } else {
        csvContent = generateAncestryTsv(mergeResult.mergedSnps)
      }

      // Phase 5: Generate log (98-100%)
      setProgress(98)
      await new Promise(resolve => setTimeout(resolve, 50))

      const logContent = generateLogFile(mergeResult.conflicts, allSkipped, excludedPAR, {
        file1: fileMetadata[0]?.name,
        file2: fileMetadata[1]?.name,
      })

      setProgress(100)

      setMergedCsv(csvContent)
      setLogFile(logContent)
      setStats({
        totalSnps: mergeResult.mergedSnps.length,
        conflicts: mergeResult.conflicts.length,
        skipped: allSkipped.length,
      })
    } catch (err) {
      setError((err as Error).message || 'An error occurred during merge')
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
        throw new Error(
          'Unable to detect file format. Please ensure the file is a valid Ancestry or MyHeritage DNA file.'
        )
      }

      const targetFormat = getOppositeFormat(sourceFormat)
      setOutputFormat(targetFormat)

      // Phase 1: Parse file (0-80%)
      const parsed =
        sourceFormat === 'ancestry'
          ? await parseAncestryFileAsync(dnaFiles[0], 1, p => setProgress(p * 0.8))
          : await parseMyHeritageFileAsync(dnaFiles[0], 1, p => setProgress(p * 0.8))

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
        csvContent = generateAncestryTsv(normalizedSnps)
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
    } catch (err) {
      setError((err as Error).message || 'An error occurred during conversion')
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
        const preferredFileName = fileMetadata[preferredFileIndex]?.name || 'file1'
        filename = `${outputFormat}--preferred-${preferredFileName}--fill-missing-${fillMissingStr}--${timestamp}.${extension}`
      }

      if (extension === 'csv') {
        downloadCsv(mergedCsv, filename)
      } else {
        downloadText(mergedCsv, filename)
      }
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
        const preferredFileName = fileMetadata[preferredFileIndex]?.name || 'file1'
        filename = `${outputFormat}--preferred-${preferredFileName}--fill-missing-${fillMissingStr}--${timestamp}--log.txt`
      }

      downloadText(logFile, filename)
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
    <Container>
      <Title>Merge DNA</Title>
      <Subtitle>Upload 1 or 2 DNA files to convert or merge</Subtitle>

      <PrivacyNotice>
        <strong>🔒 Your Privacy is Protected:</strong> All DNA file processing happens entirely in your browser on your computer.
        No data is uploaded to any server. Your genetic information never leaves your device.
      </PrivacyNotice>

      <CollapsibleSection>
        <summary>How the Merge Algorithm Works</summary>
        <DescriptionContent>
          <p>
            This tool helps you combine DNA raw data files from different testing companies (Ancestry and MyHeritage)
            into a single, comprehensive genetic profile. Here's how the algorithm works:
          </p>

          <DescriptionSubtitle>What Problem Does This Solve?</DescriptionSubtitle>
          <p>When you test with multiple DNA companies, each company may:</p>
          <DescriptionList>
            <li>Test different SNPs (genetic markers)</li>
            <li>Have gaps in their data (no-calls, shown as "--")</li>
            <li>Occasionally produce conflicting results for the same SNP</li>
          </DescriptionList>
          <p>This algorithm intelligently combines your files to give you the most complete picture of your DNA.</p>

          <DescriptionSubtitle>The Three-Step Merge Process</DescriptionSubtitle>
          <DescriptionList>
            <li>
              <strong>Step 1: Load First File</strong> - The algorithm reads all SNPs from your first file and indexes them
              by their RSID (the unique identifier like "rs3131972")
            </li>
            <li>
              <strong>Step 2: Process Second File</strong> - For each SNP in your second file, the algorithm checks if the
              RSID already exists. If it's new, it adds it. If it exists with a different genotype, it resolves the conflict
              using your chosen strategy
            </li>
            <li>
              <strong>Step 3: Sort by Genomic Position</strong> - The final merged file is sorted by chromosome number
              (1, 2, 3... 22, X, Y, MT) and position, matching standard genome references
            </li>
          </DescriptionList>

          <DescriptionSubtitle>Conflict Resolution Strategies</DescriptionSubtitle>
          <p>When the same SNP has different genotypes in both files, you can choose:</p>
          <DescriptionList>
            <li>
              <strong>"Fill Missing" (Recommended):</strong> If one file has missing data ("--" or "00") and the other has a value,
              use the value. If both have values, use the preferred file. This maximizes coverage.
            </li>
            <li>
              <strong>"Prefer File":</strong> Always use the genotype from your preferred file, regardless of missing data.
              Simpler but may lose valid data.
            </li>
          </DescriptionList>

          <DescriptionSubtitle>Understanding Your DNA Data</DescriptionSubtitle>
          <p>Each SNP (Single Nucleotide Polymorphism) contains:</p>
          <DescriptionList>
            <li><strong>RSID:</strong> Unique identifier (e.g., "rs3131972")</li>
            <li><strong>Chromosome:</strong> Location (1-22, X, Y, or MT for mitochondrial)</li>
            <li><strong>Position:</strong> Exact base pair location on that chromosome</li>
            <li><strong>Genotype:</strong> Your two alleles at that position (e.g., "AA", "GC", "TT"). You inherit one from each parent</li>
          </DescriptionList>

          <DescriptionSubtitle>Why This Matters for Genealogy</DescriptionSubtitle>
          <DescriptionList>
            <li><strong>Maximize DNA matches:</strong> More SNPs tested means better matching accuracy with genetic relatives</li>
            <li><strong>Fill testing gaps:</strong> Companies test different SNPs; merging gives you broader coverage</li>
            <li><strong>Compare testing accuracy:</strong> The log file shows where companies disagreed</li>
            <li><strong>Use specialized tools:</strong> Some genetic genealogy tools require specific SNPs that only certain companies test</li>
          </DescriptionList>

          <p style={{ marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
            The algorithm is designed to be conservative and transparent, giving you confidence that your merged DNA file
            accurately represents your genetic data while maximizing completeness.
          </p>
        </DescriptionContent>
      </CollapsibleSection>

      <UploadSection>
        <DNAFileUpload onFilesChange={handleFilesChange} resetTrigger={resetTrigger} />
      </UploadSection>

      {isMergeMode && !mergedCsv && !isProcessing && (
        <OptionsSection>
          <OptionRow>
            <label>Output Format:</label>
            <Select
              value={outputFormat}
              onChange={e => setOutputFormat(e.target.value as 'ancestry' | 'myheritage')}
            >
              <option value="myheritage">MyHeritage</option>
              <option value="ancestry">Ancestry</option>
            </Select>
          </OptionRow>
          <OptionRow>
            <LabelWithTooltip>
              <span>Prefer data source in case of conflicts:</span>
              <Tooltip content="When both tests show different values for the same genetic marker (e.g., one shows 'AT' and the other shows 'GG'), use the result from this source." />
            </LabelWithTooltip>
            <Select
              value={preferredFileIndex}
              onChange={e => setPreferredFileIndex(Number(e.target.value))}
            >
              {fileMetadata.map((file, index) => (
                <option key={index} value={index}>
                  {file.name}
                </option>
              ))}
            </Select>
          </OptionRow>
          <OptionRow>
            <LabelWithTooltip>
              <span>Fill Missing Values:</span>
              <Tooltip content="When enabled, fills gaps in one test with real data from the other test. When disabled, strictly follows your preferred source even if it has missing values (-- or 00)." />
            </LabelWithTooltip>
            <Checkbox checked={fillMissing} onChange={e => setFillMissing(e.target.checked)} />
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
                ? 'Converting...'
                : 'Merging...'
              : isSingleFileMode
                ? 'Convert'
                : 'Merge'}
          </MergeButton>
          {isProcessing && <ProgressBar progress={progress} label="Processing" />}
        </ProcessingContainer>
      )}

      {error && (
        <ResultsSection>
          <ErrorMessage>{error}</ErrorMessage>
          <ResetButton onClick={handleReset}>Try Again</ResetButton>
        </ResultsSection>
      )}

      {mergedCsv && stats && (
        <ResultsSection>
          <SuccessMessage>
            {isSingleFileMode
              ? 'Conversion completed successfully!'
              : 'Merge completed successfully!'}
          </SuccessMessage>
          <StatsList>
            <li>
              Total SNPs {isSingleFileMode ? 'converted' : 'merged'}:{' '}
              {stats.totalSnps.toLocaleString()}
            </li>
            <li>Conflicts detected: {stats.conflicts}</li>
            <li>Invalid rows skipped: {stats.skipped}</li>
          </StatsList>
          <DownloadButtonsContainer>
            <DownloadButton onClick={handleDownloadCsv}>
              Download {isSingleFileMode ? 'Converted' : 'Merged'} DNA
            </DownloadButton>
            <DownloadButton onClick={handleDownloadLog}>Download Log File</DownloadButton>
          </DownloadButtonsContainer>
          <ResetButton onClick={handleReset}>
            {isSingleFileMode ? 'Convert More Files' : 'Merge More Files'}
          </ResetButton>
        </ResultsSection>
      )}
    </Container>
  )
}
