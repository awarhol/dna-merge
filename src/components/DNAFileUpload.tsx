import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { detectFormat } from '../utils/dnaParser'
import { Tag } from './Tag'

const DropzoneContainer = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed
    ${props => (props.isDragActive ? props.theme.colors.primary : props.theme.colors.textSecondary)};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => (props.isDragActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent')};
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: rgba(99, 102, 241, 0.05);
  }
`

const DropzoneText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1rem;
  margin-top: ${props => props.theme.spacing.md};
`

const FileList = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  width: 100%;
`

const FileItem = styled.div`
  background-color: rgba(99, 102, 241, 0.1);
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`

const FileName = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.error || '#ef4444'};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;

  &:hover {
    opacity: 0.7;
  }
`

interface FileWithFormat {
  file: File
  format: 'ancestry' | 'myheritage' | 'unknown'
}

export interface FileMetadata {
  content: string
  name: string
  format: 'ancestry' | 'myheritage' | 'unknown'
}

interface DNAFileUploadProps {
  onFilesChange: (files: string[], metadata?: FileMetadata[]) => void
  resetTrigger?: number
}

export const DNAFileUpload = ({ onFilesChange, resetTrigger }: DNAFileUploadProps) => {
  const { t } = useTranslation('common')
  const [files, setFiles] = useState<FileWithFormat[]>([])

  useEffect(() => {
    if (resetTrigger !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles([])
    }
  }, [resetTrigger])

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, 2 - files.length)

      // Read files and detect formats
      const newFilesWithFormat: FileWithFormat[] = await Promise.all(
        newFiles.map(async file => {
          const content = await readFileAsText(file)
          const format = detectFormat(content)
          return { file, format }
        })
      )

      const updatedFiles = [...files, ...newFilesWithFormat].slice(0, 2)
      setFiles(updatedFiles)

      const fileContents = await Promise.all(updatedFiles.map(item => readFileAsText(item.file)))
      const metadata: FileMetadata[] = updatedFiles.map((item, index) => ({
        content: fileContents[index],
        name: item.file.name,
        format: item.format,
      }))
      onFilesChange(fileContents, metadata)
    },
    [files, onFilesChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxFiles: 2,
    disabled: files.length >= 2,
  })

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)

    Promise.all(updatedFiles.map(item => readFileAsText(item.file))).then(fileContents => {
      const metadata: FileMetadata[] = updatedFiles.map((item, idx) => ({
        content: fileContents[idx],
        name: item.file.name,
        format: item.format,
      }))
      onFilesChange(fileContents, metadata)
    })
  }

  return (
    <div>
      {files.length < 2 && (
        <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <DropzoneText>
            {isDragActive ? (
              t('upload.drop_here')
            ) : (
              <>
                {t('upload.drag_and_drop')}
                <br />
                {t('upload.file_format_info')}
              </>
            )}
          </DropzoneText>
        </DropzoneContainer>
      )}

      {files.length > 0 && (
        <FileList>
          {files.map((item, index) => (
            <FileItem key={index}>
              <FileInfo>
                <FileName>{item.file.name}</FileName>
                <Tag variant={item.format}>
                  {item.format === 'unknown' ? t('upload.unknown_format') : item.format}
                </Tag>
              </FileInfo>
              <RemoveButton onClick={() => removeFile(index)}>×</RemoveButton>
            </FileItem>
          ))}
        </FileList>
      )}
    </div>
  )
}
