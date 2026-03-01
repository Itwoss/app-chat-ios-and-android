import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import NotFound from './NotFound';

function renderWithProviders(ui) {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page Not Found" message', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderWithProviders(<NotFound />);
    expect(
      screen.getByText(/The page you're looking for doesn't exist/)
    ).toBeInTheDocument();
  });

  it('renders Go Home button', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });
});
