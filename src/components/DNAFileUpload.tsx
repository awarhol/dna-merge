import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { detectFormat } from '../utils/dna'
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

const FileItem = styled.div<{ $isDragging?: boolean }>`
  background-color: rgba(99, 102, 241, 0.1);
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  opacity: ${props => (props.$isDragging ? 0.5 : 1)};
  cursor: ${props => (props.$isDragging ? 'grabbing' : 'grab')};
  transition: opacity 0.2s ease;

  &:hover {
    background-color: rgba(99, 102, 241, 0.15);
  }
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

const DragHandle = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.2rem;
  cursor: grab;
  user-select: none;
  padding: 0 ${props => props.theme.spacing.xs};

  &:active {
    cursor: grabbing;
  }
`

const PriorityBadge = styled.div`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  white-space: nowrap;
`

const HelperText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-top: ${props => props.theme.spacing.sm};
  text-align: center;
  font-style: italic;
`

interface FileWithFormat {
  file: File
  format: 'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna' | 'unknown'
  id: string // Unique ID for drag-and-drop
}

export interface FileMetadata {
  content: string
  name: string
  format: 'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna' | 'unknown'
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
      const newFiles = acceptedFiles.slice(0, 10 - files.length)

      // Read files and detect formats
      const newFilesWithFormat: FileWithFormat[] = await Promise.all(
        newFiles.map(async file => {
          const content = await readFileAsText(file)
          const format = detectFormat(content)
          return { file, format, id: `${file.name}-${Date.now()}-${Math.random()}` }
        })
      )

      const updatedFiles = [...files, ...newFilesWithFormat].slice(0, 10)
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
    maxFiles: 10,
    disabled: files.length >= 10,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFiles(items => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        const reorderedFiles = arrayMove(items, oldIndex, newIndex)

        // Update parent with reordered files
        Promise.all(reorderedFiles.map(item => readFileAsText(item.file))).then(fileContents => {
          const metadata: FileMetadata[] = reorderedFiles.map((item, idx) => ({
            content: fileContents[idx],
            name: item.file.name,
            format: item.format,
          }))
          onFilesChange(fileContents, metadata)
        })

        return reorderedFiles
      })
    }
  }

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

  const getPriorityLabel = (index: number) => {
    const labels = ['1st Priority', '2nd Priority', '3rd Priority']
    if (index < 3) return labels[index]
    return `${index + 1}th Priority`
  }

  return (
    <div>
      {files.length < 10 && (
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
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <FileList>
                {files.map((item, index) => (
                  <SortableFileItem
                    key={item.id}
                    item={item}
                    index={index}
                    getPriorityLabel={getPriorityLabel}
                    removeFile={removeFile}
                    t={t}
                  />
                ))}
              </FileList>
            </SortableContext>
          </DndContext>
          {files.length > 1 && (
            <HelperText>
              {t('upload.drag_to_reorder', 'Drag to reorder. First file has highest priority.')}
            </HelperText>
          )}
        </>
      )}
    </div>
  )
}

// Sortable file item component
interface SortableFileItemProps {
  item: FileWithFormat
  index: number
  getPriorityLabel: (index: number) => string
  removeFile: (index: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}

const SortableFileItem = ({
  item,
  index,
  getPriorityLabel,
  removeFile,
  t,
}: SortableFileItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <FileItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <FileInfo>
        <DragHandle>≡</DragHandle>
        <PriorityBadge>{getPriorityLabel(index)}</PriorityBadge>
        <FileName>{item.file.name}</FileName>
        <Tag variant={item.format}>
          {item.format === 'unknown' ? t('upload.unknown_format') : item.format}
        </Tag>
      </FileInfo>
      <RemoveButton
        onClick={e => {
          e.stopPropagation()
          removeFile(index)
        }}
      >
        ×
      </RemoveButton>
    </FileItem>
  )
}
