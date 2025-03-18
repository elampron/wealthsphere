import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountForm } from '@/components/feature/forms/AccountForm';
import { accountsApi } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import { AccountType } from '@/types/finance';

// Mock the accountsApi
jest.mock('@/api/accounts', () => ({
  accountsApi: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('AccountForm', () => {
  const mockFamilyMembers = [
    {
      id: 1,
      user_id: 1,
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      relationship_type: 'Self',
      is_primary: true,
      expected_retirement_age: 65,
      expected_death_age: 90,
    },
  ];

  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ addToast: mockToast });
  });

  it('renders the form with default values', () => {
    render(
      <AccountForm
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        familyMembers={mockFamilyMembers}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Investment Account')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /account name/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /account type/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /institution/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /expected return rate/i })).toBeInTheDocument();
  });

  it('submits the form with new account data', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(
      <AccountForm
        isOpen={true}
        onClose={() => {}}
        onSuccess={onSuccess}
        familyMembers={mockFamilyMembers}
      />
    );

    await user.type(screen.getByRole('textbox', { name: /account name/i }), 'New Account');
    await user.type(screen.getByRole('textbox', { name: /institution/i }), 'New Bank');
    await user.type(screen.getByRole('spinbutton', { name: /expected return rate/i }), '7.5');
    await user.type(screen.getByRole('spinbutton', { name: /contribution room/i }), '15000');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(accountsApi.create).toHaveBeenCalledWith({
        account_name: 'New Account',
        account_type: AccountType.TFSA.toString(),
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles form submission errors', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to create account');
    (accountsApi.create as jest.Mock).mockRejectedValue(error);

    render(
      <AccountForm
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        familyMembers={mockFamilyMembers}
      />
    );

    await user.type(screen.getByRole('textbox', { name: /account name/i }), 'New Account');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive',
      });
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <AccountForm
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        familyMembers={mockFamilyMembers}
      />
    );

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Expected return rate is required')).toBeInTheDocument();
      expect(accountsApi.create).not.toHaveBeenCalled();
    });
  });

  it('closes the form when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <AccountForm
        isOpen={true}
        onClose={onClose}
        onSuccess={() => {}}
        familyMembers={mockFamilyMembers}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
}); 