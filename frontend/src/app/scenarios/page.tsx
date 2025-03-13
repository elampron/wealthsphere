'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scenariosApi, type Scenario } from '@/api/scenarios';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ScenarioForm } from '@/components/feature/scenarios/ScenarioForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ScenarioList } from '@/components/feature/scenarios/ScenarioList';

export default function ScenariosPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    let mounted = true;

    if (authLoading) return;

    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    async function loadScenarios() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await scenariosApi.getAll();
        if (mounted) {
          setScenarios(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load scenarios');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadScenarios();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn, authLoading, router]);

  const handleFormSubmit = async (name: string, description: string) => {
    try {
      if (selectedScenario) {
        // Update existing scenario
        const updatedScenario = await scenariosApi.update(selectedScenario.id, { name, description });
        setScenarios(scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s));
        addToast({
          title: "Success",
          description: "Scenario updated successfully",
        });
      } else {
        // Create new scenario
        const newScenario = await scenariosApi.create({ name, description });
        setScenarios([...scenarios, newScenario]);
        addToast({
          title: "Success",
          description: "Scenario created successfully",
        });
      }
      setIsFormOpen(false);
      setSelectedScenario(null);
    } catch (err) {
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Operation failed",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsFormOpen(true);
  };

  const handleDelete = async (scenario: Scenario) => {
    if (window.confirm(`Are you sure you want to delete "${scenario.name}"?`)) {
      try {
        await scenariosApi.delete(scenario.id);
        setScenarios(scenarios.filter(s => s.id !== scenario.id));
        addToast({
          title: "Success",
          description: "Scenario deleted successfully",
        });
      } catch (err) {
        addToast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete scenario",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedScenario(null);
  };

  if (authLoading) {
    return (
      <div className="container py-8">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scenarios</h1>
          <p className="text-muted-foreground mt-1">
            Manage your financial scenarios
          </p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => {
            setSelectedScenario(null);
            setIsFormOpen(true);
          }}
        >
          Add Scenario
        </Button>
      </div>

      <ScenarioList
        scenarios={scenarios}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedScenario ? 'Edit Scenario' : 'Add Scenario'}
            </DialogTitle>
            <DialogDescription>
              {selectedScenario 
                ? 'Update the details of this scenario.' 
                : 'Create a new financial scenario.'}
            </DialogDescription>
          </DialogHeader>
          <ScenarioForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            initialData={selectedScenario || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 