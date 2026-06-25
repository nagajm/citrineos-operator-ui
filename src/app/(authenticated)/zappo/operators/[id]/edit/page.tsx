import { OperatorsEdit } from '@lib/client/pages/zappo/operators.edit';

export default async function EditOperatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperatorsEdit operatorId={id} />;
}
