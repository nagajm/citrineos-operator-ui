import { CrmLeadDetailPage } from '@lib/client/pages/zappo/crm/lead-detail';

type Props = { params: Promise<{ id: string }> };
export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  return <CrmLeadDetailPage id={id} />;
}