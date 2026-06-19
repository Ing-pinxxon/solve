import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

test('renders DEUDAS//ZERO title', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const titleElement = screen.getByText(/DEUDAS\/\/ZERO/i);
  expect(titleElement).toBeInTheDocument();
});
