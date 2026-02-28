import { Header } from '@/components/layout/header';
import { FinecoImportClient } from './client';

export default function ImportPage() {
  return (
    <>
      <Header title="Import Fineco Trades" />
      <div className="w-full p-6">
        <FinecoImportClient />
      </div>
    </>
  );
}
