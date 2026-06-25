import { CrmMeetingDetailPage } from '@lib/client/pages/zappo/crm/meeting-detail';

type Props = { params: Promise<{ id: string }> };
export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params;
  return <CrmMeetingDetailPage id={id} />;
}