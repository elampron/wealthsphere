import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';

export default function InvestmentAccountForm() {
  const [accountName, setAccountName] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Create the investment account without current_balance
      const accountRes = await fetch('/api/investment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountName })
      });

      if (!accountRes.ok) {
        const errorData = await accountRes.json();
        throw new Error(errorData.detail || 'Failed to create account');
      }

      const accountData = await accountRes.json();

      // Create the corresponding entity value record for the new account
      const entityValueRes = await fetch('/api/entity-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'INVESTMENT_ACCOUNT',
          entity_id: accountData.id,
          scenario_id: 1,  // assuming scenario_id 1 corresponds to 'Actual'
          recorded_at: new Date().toISOString(),
          value: parseFloat(initialValue)
        })
      });

      if (!entityValueRes.ok) {
        const errorData = await entityValueRes.json();
        throw new Error(errorData.detail || 'Failed to create entity value');
      }

      // Redirect to investments list or detail page
      router.push('/investment-accounts');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="investment-account-form">
      <div className="form-group">
        <label htmlFor="name">Account Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="initialValue">Initial Value</label>
        <input
          type="number"
          id="initialValue"
          name="initialValue"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit">Create Account</button>
    </form>
  );
} 