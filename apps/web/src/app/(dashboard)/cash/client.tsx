'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CashFlowsTable } from '@/components/tables/cash-flows-table';
import { CashFlowForm } from '@/components/forms/cash-flow-form';
import { createCashFlow } from './actions';
import { Plus } from 'lucide-react';

interface CashPageClientProps {
  flows: any[];
}

export function CashPageClient({ flows }: CashPageClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Cash Flow
        </Button>
      </div>

      <CashFlowsTable flows={flows} />

      {showForm && (
        <CashFlowForm
          onSubmit={createCashFlow}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
