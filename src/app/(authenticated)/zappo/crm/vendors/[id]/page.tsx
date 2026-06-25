import { CrmVendorDetailPage } from '@lib/client/pages/zappo/crm/vendor-detail';

type Props = { params: Promise<{ id: string }> };
export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  return <CrmVendorDetailPage id={id} />;
}