import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EVA DMS - Depot Management System',
  description: 'EVA Gas Depot Management System for LPG operations',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
