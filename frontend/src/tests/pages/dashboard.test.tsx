import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardClient } from '@/components/feature/dashboard/DashboardClient';
import { investmentsApi } from '@/api/investments';
import { assetsApi } from '@/api/assets';
import { familyApi } from '@/api/family';
import { AccountType, InvestmentAccount, Asset, AssetType } from '@/types/finance';
import { ToastProvider } from '@/components/ui/use-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Increase Jest timeout
jest.setTimeout(30000);

// Mock the API calls
jest.mock('@/api/investments');
jest.mock('@/api/assets');
jest.mock('@/api/family');

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({
    addToast: jest.fn(),
    removeToast: jest.fn(),
    toasts: [],
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

describe('DashboardClient', () => {
  const mockInitialAccounts = [
    {
      id: 1,
      user_id: 1,
      family_member_id: 1,
      name: 'Test Account',
      account_type: AccountType.RRSP,
      institution: 'Test Bank',
      expected_return_rate: 0.05,
      is_taxable: false,
      contribution_room: 10000,
      expected_conversion_year: 2030,
      notes: 'Test notes',
      current_value: 5000
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('renders loading state when no initial accounts', async () => {
    // Mock successful API responses
    const mockAccounts: InvestmentAccount[] = [];
    const mockAssets: Asset[] = [];
    const mockFamily: { id: number; first_name: string; last_name: string; relationship_type: string }[] = [];

    (investmentsApi.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (assetsApi.getAssets as jest.Mock).mockResolvedValue(mockAssets);
    (familyApi.getAll as jest.Mock).mockResolvedValue(mockFamily);

    await act(async () => {
      renderWithProviders(<DashboardClient initialInvestmentAccounts={[]} />);
    });

    // Verify loading state is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for all API calls to complete and loading to finish
    await act(async () => {
      await waitFor(() => {
        expect(investmentsApi.getAccounts).toHaveBeenCalled();
        expect(assetsApi.getAssets).toHaveBeenCalled();
        expect(familyApi.getAll).toHaveBeenCalled();
      });
    });

    // After loading, should show empty state
    expect(screen.getByText("You don't have any investment accounts yet.")).toBeInTheDocument();
  });

  it('renders error state when API calls fail', async () => {
    // Mock API failures with generic errors
    const apiError = new Error('API Error');
    (investmentsApi.getAccounts as jest.Mock).mockRejectedValue(apiError);
    (assetsApi.getAssets as jest.Mock).mockRejectedValue(apiError);
    (familyApi.getAll as jest.Mock).mockRejectedValue(apiError);

    await act(async () => {
      renderWithProviders(<DashboardClient initialInvestmentAccounts={[]} />);
    });

    // Wait for loading state first
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for error states
    await act(async () => {
      await waitFor(() => {
        // Check for both possible error messages
        const errorElement = screen.queryByText('Failed to load investment accounts') || 
                           screen.queryByText('Failed to load dashboard data. Please try again later.');
        expect(errorElement).toBeInTheDocument();
      });
    });

    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Failed to fetch investment accounts:', apiError);
    expect(console.error).toHaveBeenCalledWith('Failed to fetch dashboard data:', apiError);
  });

  it('renders dashboard with initial accounts', async () => {
    // Mock successful API responses
    const mockAssets: Asset[] = [
      {
        id: 1,
        user_id: 1,
        name: 'Test Asset',
        asset_type: AssetType.PRIMARY_RESIDENCE,
        expected_annual_appreciation: 0.03,
        is_primary_residence: true,
        current_value: 10000,
        notes: 'Test asset notes'
      }
    ];
    const mockFamily: { id: number; first_name: string; last_name: string; relationship_type: string }[] = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        relationship_type: 'Self'
      }
    ];

    (assetsApi.getAssets as jest.Mock).mockResolvedValue(mockAssets);
    (familyApi.getAll as jest.Mock).mockResolvedValue(mockFamily);

    await act(async () => {
      renderWithProviders(<DashboardClient initialInvestmentAccounts={mockInitialAccounts} />);
    });

    // Wait for component to render with data
    await act(async () => {
      await waitFor(() => {
        expect(screen.getByText('Test Account')).toBeInTheDocument();
        expect(screen.getByText('RRSP')).toBeInTheDocument();
        // Use getAllByText for the amount since it appears multiple times
        expect(screen.getAllByText('$5,000')).toHaveLength(3);
      });
    });

    // Verify API calls
    expect(assetsApi.getAssets).toHaveBeenCalled();
    expect(familyApi.getAll).toHaveBeenCalled();
  });

  // Add test for authentication errors
  it('handles authentication errors correctly', async () => {
    // Mock API failure with auth error
    const authError = new Error('Authentication failed');
    (investmentsApi.getAccounts as jest.Mock).mockRejectedValue(authError);

    const mockRouter = { push: jest.fn() };
    (require('next/navigation') as any).useRouter = () => mockRouter;

    await act(async () => {
      renderWithProviders(<DashboardClient initialInvestmentAccounts={[]} />);
    });

    // Wait for auth error handling
    await act(async () => {
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/login?callbackUrl='));
      });
    });
  });
});