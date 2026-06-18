import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders DEUDAS//ZERO title', () => {
  render(<App />);
  const titleElement = screen.getByText(/DEUDAS\/\/ZERO/i);
  expect(titleElement).toBeInTheDocument();
});
