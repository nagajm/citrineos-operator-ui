import { OperatorsAssign } from '@lib/client/pages/zappo/operators.assign';

export default async function AssignStationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperatorsAssign operatorId={id} />;
}
