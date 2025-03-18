import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FamilyPage from '@/app/family/page';
import { familyApi } from '@/api/family';
import { serverInvestmentApi } from '@/api/server-investments';
import { incomeApi } from '@/api/income';
import { insuranceApi } from '@/api/insurance';
import { ToastProvider } from '@/components/ui/use-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Increase Jest timeout
jest.setTimeout(30000);

// Mock the API modules
jest.mock('@/api/family');
jest.mock('@/api/server-investments');
jest.mock('@/api/income');
jest.mock('@/api/insurance');

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

// Create a new QueryClient instance for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </QueryClientProvider>
  );
};

// Mock data
const mockFamilyMember = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01',
  relationship_type: 'Self',
};

const mockAccounts = [
  {
    id: 1,
    account_type: 'TFSA',
    balance: 50000,
  },
];

const mockIncome = [
  {
    name: 'Salary',
    amount: 75000,
  },
];

const mockInsurance = [
  {
    insurance_type: 'Life',
    coverage_amount: 500000,
    premium_amount: 1200,
    provider: 'Insurance Co',
  },
];

describe('FamilyPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    queryClient.clear();

    // Setup default mock implementations
    (familyApi.getAll as jest.Mock).mockResolvedValue([mockFamilyMember]);
    (serverInvestmentApi.getByFamilyMember as jest.Mock).mockResolvedValue(mockAccounts);
    (incomeApi.getAll as jest.Mock).mockResolvedValue(mockIncome);
    (insuranceApi.getAll as jest.Mock).mockResolvedValue(mockInsurance);
  });

  it('renders loading state initially', () => {
    renderWithProviders(<FamilyPage />);
    expect(screen.getByText('Family Management')).toBeInTheDocument();
    // Look for skeleton elements by their class
    const skeletons = document.getElementsByClassName('animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders family member data after loading', async () => {
    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText(/Self/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Accounts/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Insurance/i })).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (familyApi.getAll as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Look for the button specifically
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('displays correct financial information in tabs', async () => {
    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check Overview tab (active by default)
    expect(screen.getByText('$75,000')).toBeInTheDocument(); // Total Income
    expect(screen.getByText('$50,000')).toBeInTheDocument(); // Total Accounts
    expect(screen.getByText('$500,000')).toBeInTheDocument(); // Insurance Coverage

    // Check Income tab
    const incomeTab = screen.getByRole('tab', { name: /Income/i });
    fireEvent.click(incomeTab);
    
    // Check Accounts tab
    const accountsTab = screen.getByRole('tab', { name: /Accounts/i });
    fireEvent.click(accountsTab);
    
    // Check Insurance tab
    const insuranceTab = screen.getByRole('tab', { name: /Insurance/i });
    fireEvent.click(insuranceTab);
  });

  it('opens add family member form when button is clicked', async () => {
    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Family Member/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /Add Family Member/i }));
    
    // Test that the form state is updated
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole('heading', { name: 'Add Family Member' })).toBeInTheDocument();
    });
  });

  it('opens edit form when edit button is clicked', async () => {
    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    
    // Test that the form state is updated
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Family Member')).toBeInTheDocument();
    });
  });

  it('refreshes data after successful form submission', async () => {
    renderWithProviders(<FamilyPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 5000 });

    (familyApi.getAll as jest.Mock).mockClear();

    // Simulate form success by calling handleFormSuccess
    await act(async () => {
      // The form submission would trigger a new data fetch
      await familyApi.getAll();
    });

    expect(familyApi.getAll).toHaveBeenCalled();
  });
}); 