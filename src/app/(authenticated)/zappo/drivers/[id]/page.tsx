import { DriverDetail } from '@lib/client/pages/zappo/driver.detail';

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriverDetail driverId={parseInt(id, 10)} />;
}
