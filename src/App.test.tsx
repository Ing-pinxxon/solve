import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

test('renders $olve brand', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const brandElement = screen.getByText(
    (_, el) => el?.className === 'header-brand' && el.textContent === '$olve'
  );
  expect(brandElement).toBeInTheDocument();
});
