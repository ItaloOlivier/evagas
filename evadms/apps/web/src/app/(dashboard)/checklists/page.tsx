'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, ClipboardCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/utils';

// Mock data
const mockTemplates = [
  {
    id: '1',
    name: 'Daily Vehicle Inspection',
    category: 'safety',
    type: 'vehicle_inspection',
    status: 'active',
    version: 3,
    itemCount: 15,
    blocksOnFailure: true,
  },
  {
    id: '2',
    name: 'Pre-Delivery Safety Check',
    category: 'safety',
    type: 'pre_delivery',
    status: 'active',
    version: 2,
    itemCount: 8,
    blocksOnFailure: true,
  },
  {
    id: '3',
    name: 'Cylinder Inspection',
    category: 'quality',
    type: 'cylinder_inspection',
    status: 'active',
    version: 1,
    itemCount: 12,
    blocksOnFailure: false,
  },
  {
    id: '4',
    name: 'Monthly Depot Audit',
    category: 'compliance',
    type: 'depot_audit',
    status: 'active',
    version: 4,
    itemCount: 25,
    blocksOnFailure: false,
  },
  {
    id: '5',
    name: 'Driver Training Checklist',
    category: 'training',
    type: 'driver_training',
    status: 'draft',
    version: 1,
    itemCount: 20,
    blocksOnFailure: false,
  },
];

const mockResponses = [
  {
    id: '1',
    template: 'Daily Vehicle Inspection',
    entity: 'Vehicle: GH 123 GP',
    respondent: 'John Doe',
    status: 'completed',
    passed: true,
    itemCount: 15,
    passedCount: 15,
    failedCount: 0,
    completedAt: '2024-01-15T08:15:00Z',
  },
  {
    id: '2',
    template: 'Pre-Delivery Safety Check',
    entity: 'Order: ORD-2024-0156',
    respondent: 'Mike Smith',
    status: 'completed',
    passed: true,
    itemCount: 8,
    passedCount: 8,
    failedCount: 0,
    completedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '3',
    template: 'Daily Vehicle Inspection',
    entity: 'Vehicle: GH 456 GP',
    respondent: 'Peter Jones',
    status: 'completed',
    passed: false,
    itemCount: 15,
    passedCount: 13,
    failedCount: 2,
    completedAt: '2024-01-15T07:45:00Z',
    blocked: true,
  },
  {
    id: '4',
    template: 'Cylinder Inspection',
    entity: 'Batch: RF-2024-045',
    respondent: 'Admin User',
    status: 'in_progress',
    passed: null,
    itemCount: 12,
    passedCount: 8,
    failedCount: 0,
    startedAt: '2024-01-15T10:00:00Z',
  },
];

const templateStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
};

export default function ChecklistsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground">
            Manage safety, quality, and compliance checklists
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTemplates.filter((t) => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockResponses.filter((r) => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockResponses.filter((r) => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card className={mockResponses.some((r) => r.blocked) ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {mockResponses.some((r) => r.blocked) && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              Blocked Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockResponses.filter((r) => r.blocked).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="responses">
        <TabsList>
          <TabsTrigger value="responses">Recent Responses</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Checklist Responses</CardTitle>
              <CardDescription>Completed and in-progress checklists</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{response.template}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {response.entity}
                      </TableCell>
                      <TableCell>{response.respondent}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${((response.passedCount + response.failedCount) / response.itemCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {response.passedCount + response.failedCount}/{response.itemCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {response.status === 'completed' ? (
                          response.passed ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Passed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>Failed</span>
                              {response.blocked && (
                                <Badge variant="destructive" className="ml-1">
                                  Blocked
                                </Badge>
                              )}
                            </div>
                          )
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {response.completedAt ? formatDateTime(response.completedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {response.status === 'in_progress' && (
                              <DropdownMenuItem>Continue</DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Templates</CardTitle>
              <CardDescription>Configure reusable checklist templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Blocks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.itemCount} items</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        {template.blocksOnFailure ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={templateStatusConfig[template.status]?.variant || 'default'}>
                          {templateStatusConfig[template.status]?.label || template.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit Template</DropdownMenuItem>
                            <DropdownMenuItem>View Items</DropdownMenuItem>
                            {template.status === 'draft' && (
                              <DropdownMenuItem>Activate</DropdownMenuItem>
                            )}
                            {template.status === 'active' && (
                              <DropdownMenuItem>Archive</DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            {template.status === 'draft' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
