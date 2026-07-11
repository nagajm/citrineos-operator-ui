import { OperatorStatement } from '@lib/client/pages/zappo/operator-statement';

export default async function OperatorStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperatorStatement operatorId={parseInt(id, 10)} />;
}
