import { Scenario } from '@/api/scenarios';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

interface ScenarioListProps {
  scenarios: Scenario[];
  loading: boolean;
  onEdit: (scenario: Scenario) => void;
  onDelete: (scenario: Scenario) => void;
}

export function ScenarioList({ scenarios, loading, onEdit, onDelete }: ScenarioListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (scenarios.length === 0) {
    return <EmptyState />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Scenario Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scenarios.map((scenario) => (
          <TableRow key={scenario.id}>
            <TableCell className="font-medium">{scenario.name}</TableCell>
            <TableCell>{scenario.description || 'No description'}</TableCell>
            <TableCell>{formatDate(new Date(scenario.created_at))}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(scenario)}
                  disabled={scenario.is_locked}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(scenario)}
                  disabled={scenario.is_locked}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
      <p className="text-muted-foreground mb-4">
        Create a new scenario to start planning your financial future
      </p>
    </div>
  );
} 