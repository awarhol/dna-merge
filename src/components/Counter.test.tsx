import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { Counter } from './Counter'
import { theme } from '@/styles/theme'

describe('Counter', () => {
  const renderCounter = () => {
    return render(
      <ThemeProvider theme={theme}>
        <Counter />
      </ThemeProvider>
    )
  }

  it('renders with initial count of 0', () => {
    renderCounter()
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('increments count when + button is clicked', async () => {
    const user = userEvent.setup()
    renderCounter()

    const incrementButton = screen.getByText('+')
    await user.click(incrementButton)

    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('decrements count when - button is clicked', async () => {
    const user = userEvent.setup()
    renderCounter()

    const decrementButton = screen.getByText('-')
    await user.click(decrementButton)

    expect(screen.getByTestId('count')).toHaveTextContent('-1')
  })

  it('resets count to 0 when Reset button is clicked', async () => {
    const user = userEvent.setup()
    renderCounter()

    const incrementButton = screen.getByText('+')
    await user.click(incrementButton)
    await user.click(incrementButton)

    const resetButton = screen.getByText('Reset')
    await user.click(resetButton)

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })
})
